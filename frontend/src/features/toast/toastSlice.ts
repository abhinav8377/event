import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Toast {
  id: number
  type: "success" | "error" | "info"
  message: string
}

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = { toasts: [] }
let nextId = 1

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload)
      },
      prepare(input: { type: Toast["type"]; message: string }) {
        return { payload: { id: nextId++, ...input } }
      },
    },
    dismissToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
  },
})

export const { pushToast, dismissToast } = toastSlice.actions
export default toastSlice.reducer
