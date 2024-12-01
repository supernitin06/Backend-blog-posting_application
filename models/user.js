const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost/project1')

const usermodel = mongoose.Schema({
    name:String,
    username : String,
    password : String,
    email : String,
    age: String,
    posts:[
        {
            type : mongoose.Schema.Types.ObjectId, 
            ref : "post",
        }
    ]
})

module.exports = mongoose.model('user', usermodel)
