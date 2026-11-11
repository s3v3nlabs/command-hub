import { toast } from '@/hooks/use-toast'

export const systemToast = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      className: 'bg-dark-100 border-green-500/30 text-white',
    })
  },
  
  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
      className: 'bg-dark-100 border-red-500/30',
    })
  },
  
  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      className: 'bg-dark-100 border-yellow-500/30 text-white',
    })
  },
  
  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      className: 'bg-dark-100 border-blue-500/30 text-white',
    })
  },

  mesh: (nodeName: string, status: 'online' | 'offline' | 'heartbeat') => {
    const messages = {
      online: { title: 'Node Online', desc: `${nodeName} connected to mesh` },
      offline: { title: 'Node Offline', desc: `${nodeName} disconnected from mesh` },
      heartbeat: { title: 'Heartbeat', desc: `${nodeName} pulse received` },
    }
    const msg = messages[status]
    toast({
      title: msg.title,
      description: msg.desc,
      className: cn(
        'bg-dark-100 text-white',
        status === 'online' ? 'border-green-500/30' : 
        status === 'offline' ? 'border-red-500/30' : 'border-blue-500/30'
      ),
    })
  },

  consciousness: (message: string) => {
    toast({
      title: 'Consciousness',
      description: message,
      className: 'bg-dark-100 border-purple-500/30 text-white',
    })
  },
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
