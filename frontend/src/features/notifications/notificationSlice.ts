import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import * as notificationApi from "@/api/notificationApi"
import type { AppNotification } from "@/constants/types"

interface NotificationState {
  items: AppNotification[]
  loading: boolean
}

const initialState: NotificationState = { items: [], loading: false }

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (userId: string) => {
    const res = await notificationApi.getNotifications(userId)
    return res.data
  },
)

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    await notificationApi.markRead(id)
    return id
  },
)

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (userId: string) => {
    await notificationApi.markAllRead(userId)
    return userId
  },
)

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => {
        s.loading = true
      })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false
        s.items = a.payload
      })
      .addCase(markNotificationRead.fulfilled, (s, a) => {
        const n = s.items.find((x) => x.id === a.payload)
        if (n) n.read = true
      })
      .addCase(markAllNotificationsRead.fulfilled, (s) => {
        s.items.forEach((n) => {
          n.read = true
        })
      })
  },
})

export default notificationSlice.reducer
