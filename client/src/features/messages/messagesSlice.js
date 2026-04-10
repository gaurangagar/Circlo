import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
  messages:[]
}

export const fetchMessages=createAsyncThunk()

export const messagesSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
  },
  extraReducers:{
  }
})

// Action creators are generated for each case reducer function
export const { } = messagesSlice.actions

export default messagesSlice.reducer