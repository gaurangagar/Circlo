import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState = {
  connections:[],
  pendingConnections:[],
  followers:[],
  following:[]
}

export const fetchConnections=createAsyncThunk()

export const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
  },
  // extraReducers:(builder)={
  // }
})

// Action creators are generated for each case reducer function
export const { } = connectionsSlice.actions

export default connectionsSlice.reducer