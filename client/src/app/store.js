import { configureStore } from '@reduxjs/toolkit'
import connectionsReducer from '../features/connections/connectionsSlice'
import messagesReducer from '../features/messages/messagesSlice'
import UserReducer from '../features/user/userSlice'

export const store = configureStore({
  reducer: {
    connections:connectionsReducer,
    messages:messagesReducer,
    User:UserReducer
  },
})