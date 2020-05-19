let express = require('express');
let router 	= express.Router();
const util = require('util');
const fs 	= require('fs');
const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const UsersModel    = require(__path_models   + 'users');
const GroupsModel   = require(__path_models   + 'groups');
const ValidateUsers	= require(__path_validates + 'users');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const UploadHelpers = require(__path_helpers + 'upload');
const ParamsHelpers = require(__path_helpers + 'params');
const linkIndex		 = '/' + systemConfig.prefixAdmin + '/users/';
const pageTitleIndex = 'User Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views + 'pages/users/';
const uploadAvatar = UploadHelpers.upload('avatar','users');




// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let params = {}; 
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', ''); 
	params.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	params.sortField= ParamsHelpers.getParam(req.session, 'sort_field', 'name'); 
	params.sortType= ParamsHelpers.getParam(req.session, 'sort_type', 'desc'); 
	params.groupID  = ParamsHelpers.getParam(req.session,'group_id','');
	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'users');
	let groupsItems = []; 
	await GroupsModel.listItemsInSelectbox().then((items)=>{
	  groupsItems = items; 
	  groupsItems.unshift({_id: 'allvalue', name: 'All Group'})
	});
	
	await UsersModel.countItem(params).then((data)=>{
		params.pagination.totalItems = data;  
		});

	await UsersModel.listItems(params)
    .then((items)=>{
      res.render(`${folderView}list`,{
                                      pageTitle:pageTitleIndex,
                                      items,
                                      statusFilter,
                                      groupsItems,
                                      params
                });
    })
});

// Change status
router.get('/change-status/:id/:status', async (req, res, next) => {
	let currentStatus  = ParamsHelpers.getParam(req.params,'status','active');
	let id             = ParamsHelpers.getParam(req.params,'id','');
  
  await UsersModel.changeStatus(id, currentStatus,{task:"update-one"}).then((result)=>{
	req.flash('success', 'Updated status successfully',false);
	res.redirect(linkIndex)
  })
  }); 

// Change status - Multi
router.post('/change-status/:status', async (req, res) => {
	let currentStatus  = ParamsHelpers.getParam(req.params,'status','active');
	await UsersModel.changeStatus(req.body.cid,currentStatus, {task:"update-multi"}).then((result) =>{
	  req.flash('success', `Update ${result.n} status successfully`,false);
	  res.redirect(linkIndex)
	});
  });
// Change ordering - Multi
router.post('/change-ordering', async (req, res) => {
	//single item 
	let cids = req.body.cid;
	let orderings = req.body.ordering; 
   await UsersModel.changeOrdering(cids, orderings, null).then((result)=>{
	req.flash('success', 'Change Ordering successfully',false);
	res.redirect(linkIndex)
	})});

// Delete
router.get('/delete/:id', async (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	await UsersModel.deleteItem(id,{task:"delete-one"}).then(( result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	UsersModel.deleteItem(req.body.cid,{task:"delete-many"}).then((result) => {
	
		res.redirect(linkIndex);
	});
});

// FORM
router.get('/form(/:id)?', async (req, res, next) => {
    let id = ParamsHelpers.getParam(req.params,'id',''); 
    let item = {name:'', ordering: 0, status: 'novalue'};
    let errors = null; 
    let groupsItems = []; 
    await GroupsModel.listItemsInSelectbox().then((items)=>{
      groupsItems = items; 
      groupsItems.unshift({_id: 'allvalue', name: 'All Group'})
    });
    if(id === ''){//Add
      res.render(`${folderView}form`, { pageTitle: pageTitleAdd,item,errors,groupsItems });
    } else { //Edit
      await UsersModel.getItem(id).then((item) => {
        res.render(`${folderView}form`, { pageTitle: pageTitleEdit,item,errors,groupsItems });
      });};
  }); 
// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	uploadAvatar(req, res, async (errUpload) => {
		req.body = JSON.parse(JSON.stringify(req.body));
		ValidateUsers.validator(req);
		let item = Object.assign(req.body);
		let taskCurrent = (typeof item !== 'undefined' && item.id !== '')? 'edit':'add';		
		let errors = ValidateUsers.validator(req,errUpload,taskCurrent);	 

		if(errors.length > 0){	
		let pageTitle = (taskCurrent == 'add')? pageTitleAdd: pageTitleEdit; 
		if(req.file != undefined) UploadHelpers.remove('public/upload/users/',req.file.filename) // xoá hình khi form ko hợp lệ
		let groupsItems = []; 
		await GroupsModel.listItemsInSelectbox().then((items)=>{
		  groupsItems = items; 
		  groupsItems.unshift({_id: 'allvalue', name: 'All Group'})
		});
		if (taskCurrent == "edit") item.avatar = item.image_old;
		res.render(`${folderView}form`, { pageTitle: pageTitle, item, errors, groupsItems});
		} else {
			let message =(taskCurrent == 'add')? notify.ADD_SUCCESS: notify.EDIT_SUCCESS; 
			if(req.file == undefined){///chỉ edit thông tin cơ bản không có upload lại hình
				item.avatar = item.image_old;
			} else {
				item.avatar = req.file.filename;
				if(taskCurrent == "edit")  UploadHelpers.remove('public/upload/users/',item.image_old)
			}
		//edit avatar
			UsersModel.saveItem(item,{task:taskCurrent}).then((result) => {
				req.flash('success', message, false);
				res.redirect(linkIndex);
			});
		}
	})
	
});
//SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
	req.session.sort_field=  ParamsHelpers.getParam(req.params,'sort_field','ordering');
	req.session.sort_type =  ParamsHelpers.getParam(req.params,'sort_type','asc');
	res.redirect(linkIndex);
});

//FILTER GROUPs
router.get(('/filter_group/:group_id'), (req, res, next) => {
	req.session.group_id=  ParamsHelpers.getParam(req.params,'group_id','');
	res.redirect(linkIndex);
});
module.exports = router;
