const mongoose = require('mongoose');
const databaseConfig = require(__path_configs + 'database');

var schema = new mongoose.Schema({ 
    name: String, 
    status: String,
    ordering: Number,
    avatar:String,
    group: {
        id: String,
        name: String
    },
    created: {
        user_id: Number, 
        user_name: String,
        time:Date
    },
    modified: {
        user_id: Number, 
        user_name: String, 
        time:Date
    },
    content:String
});

module.exports = mongoose.model(databaseConfig.col_users, schema );