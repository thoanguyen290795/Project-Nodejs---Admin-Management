
const UsersModel    = require(__path_schemas    + 'users');
const fs 	= require('fs');
const UploadHelpers = require(__path_helpers + 'upload');
module.exports = {
    listItems: (params, options = null) => {
        let objWhere    = {};
        let sort		= {};
        if(params.groupID != 'allvalue' &&   params.groupID != '') objWhere['group.id'] = params.groupID; 
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus;
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i');
        
        sort[params.sortField]  = params.sortType;
        return UsersModel
            .find(objWhere)
            .select('name status avatar ordering created modified group.name group.id')
            .sort(sort)
            .skip((params.pagination.currentPage-1) * params.pagination.totalItemsPerPage)
            .limit(params.pagination.totalItemsPerPage);
    },
    getItem: (id, options=null) => {
     return   UsersModel.findById(id);
    },
    countItem: (params, options=null) => {
        let objWhere = {};
        if(params.groupID !== 'allvalue' && params.groupID !== '') objWhere['group.id'] = params.groupID; 
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus; 
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i'); 
      return  UsersModel.count(objWhere)
    },
    changeStatus: (id, currentStatus, options=null) => {
        //active <=> inactive 
        let status = (currentStatus == "inactive")? "active" : "inactive";
        let data = {
          status: status,
          modified: {
            user_id: 0,
            user_name: 'admin', 
            time: Date.now()
          }
        }
        if(options.task == "update-one"){
            return UsersModel.updateOne({ _id:id }, data);
        }
        if(options.task == "update-multi") {
            data.status = currentStatus;
            return UsersModel.updateMany({ _id: {$in:id}}, data);
        } 
      },
      deleteItem: async (id,options=null)=>{
        if(options.task == "delete-one"){
          await UsersModel.findById(id).then((item)=>{
            UploadHelpers.remove('public/upload/users/',item.avatar)
           });
            return UsersModel.deleteOne({_id: id}) 
        } 
        if(options.task == "delete-many"){
          if(Array.isArray(id)){
            for(let i = 0; i< id.length; i++){
              await UsersModel.findById(id[i]).then((item)=>{
                UploadHelpers.remove('public/upload/users/',item.avatar)
               });
            }
          } else {
            await UsersModel.findById(id).then((item)=>{
              UploadHelpers.remove('public/upload/users/',item.avatar)
             });
          }
            return UsersModel.remove({_id: {$in:id }}) 
        }
},
    changeOrdering: async (cids,orderings, options=null) => {
        //active <=> inactive 
        let data = {
            ordering: parseInt(orderings),
            modified: {
              user_id: 0,
              user_name: 'admin', 
              time: Date.now()
            }
          }
        if(Array.isArray(cids)){
            for (let index = 0; index < cids.length; index++){     
                data.ordering = parseInt(orderings[index]);
               await UsersModel.updateOne({ _id:cids[index] }, data);
                 }
                return Promise.resolve(true)
        }
         else {
          return  UsersModel.updateOne({ _id:cids },data);
        }
      },
  
        saveItem: (item,options=null)=>{
            if(options.task== "add"){
                item.created = {
                    user_id : 0,
                    user_name: 'admin',
                    time: Date.now()
                  }
                item.group = {
                  id: item.group_id,
                  name:item.group_name
                }
                return new UsersModel(item).save(); 
            }
        
            if(options.task== "edit"){
             return  UsersModel.updateOne({ _id:item.id },{ 
                    ordering: parseInt(item.ordering),
                    name:item.name,
                    status:item.status,
                    content: item.content,
                    avatar:item.avatar,
                    group: {
                      id: item.group_id,
                      name:item.group_name
                    },
                    modified: {
                      user_id: 0,
                      user_name: 'admin', 
                      time: Date.now()
                    }
                  }
                  )
        }
            if(options.task == "change-group-name"){
          return  UsersModel.updateMany({'group.id':item.id },{ 
                 group: {
                   id:item.id,
                   name:item.name
                 }
               }
               )
     }
    }
}
        