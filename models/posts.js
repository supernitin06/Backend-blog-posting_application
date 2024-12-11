
const mongoose = require('mongoose')


const postschema = mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  date:{
      type :Date, 
      default: Date.now()
  },
  content: String,
  Like:[{
    type :mongoose.Schema.Types.ObjectId,
    ref : "user",
  }]



})
module.exports = mongoose.model('posts',postschema)