import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const initialState = {
  value:null
}

export const fetchUser=createAsyncThunk()

export const updateUser=createAsyncThunk()

export const userSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
  },
  extraReducers:{
  }
})

// Action creators are generated for each case reducer function
export const { } = userSlice.actions

export default userSlice.reducer