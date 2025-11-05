// src/models/State.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IState extends Document {
  name: string;
  code?: string;
  country: mongoose.Types.ObjectId;
}

const stateSchema = new Schema<IState>({
  name: { type: String, required: true },
  code: String,
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
});

const State = mongoose.model<IState>('State', stateSchema);

export default State;
