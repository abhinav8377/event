import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("eventhub_token")
    socket = io(import.meta.env.VITE_SOCKET_URL || "/", {
      auth: { token },
      transports: ["websocket", "polling"],
    })
  }
  return socket
}

export function resetSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
