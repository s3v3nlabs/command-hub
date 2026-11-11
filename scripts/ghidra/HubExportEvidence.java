// Command Hub RE Workbench — read-only Ghidra headless evidence export.
// Statically analyzes an imported program and writes JSON evidence. It never
// executes the target. Usage (driven by lib/offsec/re-workbench/ghidra.ts):
//   analyzeHeadless <proj> <name> -import <file> -scriptPath scripts/ghidra \
//     -postScript HubExportEvidence.java <out.json> summary|function [subject] -deleteProject
//@category CommandHub
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.Address;
import ghidra.program.model.data.StringDataInstance;
import ghidra.program.model.listing.Data;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.listing.InstructionIterator;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.listing.DataIterator;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;

public class HubExportEvidence extends GhidraScript {
  private static final int CAP = 5000;

  private static String q(String s) {
    if (s == null) return "\"\"";
    StringBuilder b = new StringBuilder("\"");
    for (char c : s.toCharArray()) {
      switch (c) {
        case '"': b.append("\\\""); break;
        case '\\': b.append("\\\\"); break;
        case '\n': b.append("\\n"); break;
        case '\r': b.append("\\r"); break;
        case '\t': b.append("\\t"); break;
        default:
          if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
          else b.append(c);
      }
    }
    return b.append('"').toString();
  }

  private static String hex(Address a) {
    return q("0x" + a.toString());
  }

  @Override
  public void run() throws Exception {
    String[] a = getScriptArgs();
    String out = a[0];
    String mode = a.length > 1 ? a[1] : "summary";
    String subject = a.length > 2 ? a[2] : "";
    FunctionManager fm = currentProgram.getFunctionManager();
    StringBuilder j = new StringBuilder("{");
    j.append("\"program\":").append(q(currentProgram.getName()));
    j.append(",\"language\":").append(q(currentProgram.getLanguageID().toString()));
    j.append(",\"compiler\":").append(q(currentProgram.getCompilerSpec().getCompilerSpecID().toString()));
    j.append(",\"imageBase\":").append(hex(currentProgram.getImageBase()));
    j.append(",\"executableFormat\":").append(q(currentProgram.getExecutableFormat()));

    if (mode.equals("summary")) {
      int n = 0;
      j.append(",\"functions\":[");
      for (Function f : fm.getFunctions(true)) {
        if (n >= CAP) break;
        if (n++ > 0) j.append(",");
        j.append("{\"name\":").append(q(f.getName()))
          .append(",\"address\":").append(hex(f.getEntryPoint()))
          .append(",\"size\":").append(f.getBody().getNumAddresses())
          .append(",\"thunk\":").append(f.isThunk())
          .append(",\"signature\":").append(q(f.getPrototypeString(false, false))).append("}");
      }
      n = 0;
      j.append("],\"imports\":[");
      for (Symbol s : currentProgram.getSymbolTable().getExternalSymbols()) {
        if (n >= CAP) break;
        if (n++ > 0) j.append(",");
        j.append("{\"name\":").append(q(s.getName()))
          .append(",\"library\":").append(q(s.getParentNamespace().getName())).append("}");
      }
      n = 0;
      j.append("],\"symbols\":[");
      for (Symbol s : currentProgram.getSymbolTable().getAllSymbols(true)) {
        if (n >= CAP) break;
        if (s.isExternal()) continue;
        if (n++ > 0) j.append(",");
        j.append("{\"name\":").append(q(s.getName(true)))
          .append(",\"address\":").append(hex(s.getAddress()))
          .append(",\"type\":").append(q(s.getSymbolType().toString())).append("}");
      }
      n = 0;
      j.append("],\"strings\":[");
      DataIterator di0 = currentProgram.getListing().getDefinedData(true);
      while (di0.hasNext() && n < CAP) {
        Data d = di0.next();
        if (!StringDataInstance.isString(d)) continue;
        String v = StringDataInstance.getStringDataInstance(d).getStringValue();
        if (v == null) continue;
        if (n++ > 0) j.append(",");
        j.append("{\"address\":").append(hex(d.getAddress())).append(",\"string\":").append(q(v)).append("}");
      }
      j.append("]");
    } else {
      Function f = null;
      if (subject.startsWith("0x")) {
        f = fm.getFunctionContaining(toAddr(subject.substring(2)));
      }
      if (f == null) {
        for (Function g : fm.getFunctions(true)) {
          if (g.getName().equals(subject)) { f = g; break; }
        }
      }
      if (f == null) {
        j.append(",\"error\":").append(q("function not found: " + subject));
      } else {
        j.append(",\"function\":{\"name\":").append(q(f.getName()))
          .append(",\"address\":").append(hex(f.getEntryPoint()))
          .append(",\"signature\":").append(q(f.getPrototypeString(false, false))).append("}");
        DecompInterface di = new DecompInterface();
        di.openProgram(currentProgram);
        DecompileResults r = di.decompileFunction(f, 120, monitor);
        String c = (r != null && r.decompileCompleted() && r.getDecompiledFunction() != null)
          ? r.getDecompiledFunction().getC() : null;
        j.append(",\"pseudocode\":").append(c == null ? "null" : q(c));
        j.append(",\"decompileError\":").append(q(r == null ? "no result" : r.getErrorMessage()));
        di.dispose();
        int n = 0;
        j.append(",\"assembly\":[");
        InstructionIterator it = currentProgram.getListing().getInstructions(f.getBody(), true);
        while (it.hasNext() && n < 20000) {
          Instruction ins = it.next();
          if (n++ > 0) j.append(",");
          j.append("{\"address\":").append(hex(ins.getAddress())).append(",\"text\":").append(q(ins.toString())).append("}");
        }
        n = 0;
        j.append("],\"xrefs\":[");
        for (Reference ref : getReferencesTo(f.getEntryPoint())) {
          if (n >= CAP) break;
          if (n++ > 0) j.append(",");
          Function from = fm.getFunctionContaining(ref.getFromAddress());
          j.append("{\"from\":").append(hex(ref.getFromAddress()))
            .append(",\"type\":").append(q(ref.getReferenceType().toString()))
            .append(",\"fromFunction\":").append(q(from == null ? "" : from.getName())).append("}");
        }
        j.append("]");
      }
    }
    j.append("}");
    try (Writer w = new OutputStreamWriter(new FileOutputStream(out), "UTF-8")) {
      w.write(j.toString());
    }
  }
}
