import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import authReducer from "@/features/auth/authSlice"
import notificationReducer from "@/features/notifications/notificationSlice"
import toastReducer from "@/features/toast/toastSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    toast: toastReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
