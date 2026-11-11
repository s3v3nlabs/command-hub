import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  ChevronDown,
  CreditCard,
  DollarSign,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PieChart,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Mobile Nav */}
      <div className="flex h-14 items-center px-4 border-b lg:h-[60px] lg:hidden">
        <Button variant="outline" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6" />
          <span className="text-lg font-semibold">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-[270px] flex-col border-r bg-background lg:flex">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
            <div className="flex items-center gap-2">
              <Layers className="h-6 w-6" />
              <span className="text-lg font-semibold">Dashboard</span>
            </div>
          </div>
          <nav className="grid gap-1 p-2">
            <Button variant="ghost" className="justify-start gap-2">
              <Home className="h-5 w-5" />
              Home
            </Button>
            <Button variant="secondary" className="justify-start gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <Package className="h-5 w-5" />
              Projects
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <CreditCard className="h-5 w-5" />
              Billing
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <Users className="h-5 w-5" />
              Team
            </Button>
            <Button variant="ghost" className="justify-start gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          {/* Desktop Header */}
          <header className="hidden h-14 items-center gap-4 border-b bg-background px-4 lg:flex lg:h-[60px]">
            <div className="w-full flex-1">
              <form>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </form>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/diverse-avatars.png" alt="Avatar" />
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">John Doe</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Content */}
          <div className="flex-1 space-y-4 p-4 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <div className="flex items-center gap-2">
                <Button>Download Report</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>You made 265 sales this month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div className="flex items-center" key={i}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`/diverse-group.png?height=36&width=36&query=person${i}`}
                            alt="Avatar"
                          />
                          <AvatarFallback>OM</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">Olivia Martin</p>
                          <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
                        </div>
                        <div className="ml-auto font-medium">+$1,999.00</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>You had 24 activities this week.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div className="flex items-center" key={i}>
                        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                          <AvatarImage
                            src={`/generic-icon.png?height=36&width=36&query=icon${i}`}
                            alt="Avatar"
                          />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">You created a new project</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
