const ItemsModel 	= require(__path_schemas + 'groups');

module.exports = {
    listItems: (params, options=null) => {
        let objWhere = {};
        let sort = {};
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus; 
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i'); 
  
        sort[params.sortField] = params.sortType; 
return  ItemsModel
		.find(objWhere)
		.select('name status ordering created modified group_acp')
		.sort(sort)
        .skip((params.pagination.currentPage-1) * params.pagination.totalItemsPerPage)
        .limit(params.pagination.totalItemsPerPage)
    }, 
    getItem: (id,options=null ) =>{
        return ItemsModel.findById(id);
    },
    listItemsInSelectbox: (params, options=null) => {
        return  ItemsModel.find({},{_id: 1,name: 1});
       },
    countItem: (params, options=null) => {
        let objWhere = {};
        if(params.currentStatus !== 'all') objWhere.status = params.currentStatus; 
        if(params.keyword !== '') objWhere.name = new RegExp(params.keyword, 'i'); 
        return  ItemsModel.count(params.objWhere)
      },
    changeStatus: (id,currentStatus, options=null) =>{
        let status			= (currentStatus === "active") ? "inactive" : "active";
        let data = {
            modified: {
                user_id:0,
                user_name:'admin',
                time:Date.now()
            }
        }
        if(options.task == 'update-one'){
            data.status = status;
            return ItemsModel.updateOne({_id: id}, data)
        }
        if(options.task = "update-many"){
            data.status = currentStatus; 
            return ItemsModel.updateMany({_id: {$in: id }}, data)
        }
    },
    changeOrdering: async(cids, orderings, options = null) =>{
        let data = {
            ordering: parseInt(orderings),  
            modified: {
                user_id:0,
                user_name:'admin',
                time:Date.now()
            }
        }
        if(Array.isArray(cids)){
            for(let index = 0; index < cids.length; index ++){
                data.ordering =   parseInt(orderings[index]);
             await  ItemsModel.updateOne({_id: cids[index]}, data);
            }
            return Promise.resolve('success')
        } else {
            return ItemsModel.updateOne({_id: cids}, data);
        }
    },
    deleteItem: (id,options=null)=>{
        if(options.task == "delete-one"){
            return ItemsModel.deleteOne({_id: id}) 
        } 
        if(options.task == "delete-many"){
            return ItemsModel.remove({_id: {$in:id }}) 
        }
},
saveItem: (item,options = null)=>{
    if(options.task == 'add'){
        item.created = {
            user_id: 0,
            user_name: 'admin',
            time:Date.now()
        }
       return  new ItemsModel(item).save();
    } 
    if(options.task == 'edit'){
       return ItemsModel.updateOne({_id: item.id}, {
            ordering: parseInt(item.ordering),
            name: item.name,
            status: item.status,
            content: item.content,
            modified: {
                user_id:0,
                user_name:'admin',
                time:Date.now()},
           
        })
    }
}, 
changeGroupACP: (currentGroup, id) =>{
	let group_acp			= (currentGroup == "yes") ? "no" : "yes";
	let data = {
		group_acp: group_acp, 
		modified: {
			user_id:0,
			user_name:'admin',
			time:Date.now()
		}
	}
	return ItemsModel.updateOne({_id: id}, data)
}
}