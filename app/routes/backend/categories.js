var express = require('express');
var router 	= express.Router();
const util = require('util');

const systemConfig  = require(__path_configs + 'system');
const notify  		= require(__path_configs + 'notify');
const CategoiesModel 	= require(__path_models + 'categories');
const UsersModel    = require(__path_models   + 'users');
const ValidateCategories	= require(__path_validates + 'categories');
const UtilsHelpers 	= require(__path_helpers + 'utils');
const ParamsHelpers = require(__path_helpers + 'params');

const linkIndex		 = '/' + systemConfig.prefixAdmin + '/categories/';
const pageTitleIndex = 'Category Management';
const pageTitleAdd   = pageTitleIndex + ' - Add';
const pageTitleEdit  = pageTitleIndex + ' - Edit';
const folderView	 = __path_views + 'pages/categories/';

// List items
router.get('(/status/:status)?', async (req, res, next) => {
	let params = {}; 
	params.keyword		 = ParamsHelpers.getParam(req.query, 'keyword', ''); 
	params.currentStatus= ParamsHelpers.getParam(req.params, 'status', 'all'); 
	let statusFilter = await UtilsHelpers.createFilterStatus(params.currentStatus,'categories');
	params.sortField= ParamsHelpers.getParam(req.session, 'sort_field', 'name'); 
	params.sortType= ParamsHelpers.getParam(req.session, 'sort_type', 'desc'); 
	params.pagination 	 = {
		totalItems		 : 1,
		totalItemsPerPage: 5,
		currentPage		 : parseInt(ParamsHelpers.getParam(req.query, 'page', 1)),
		pageRanges		 : 3
	};

	await CategoiesModel.countItem(params).then( (data) => {
		params.pagination.totalItems = data;
	});
	CategoiesModel.listItems(params).then( (items) => {
			res.render(`${folderView}list`, { 
				pageTitle: pageTitleIndex,
				items,
				statusFilter,
				params
			});
		});
});

// Change status
router.get('/change-status/:id/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 
	CategoiesModel.changeStatus(id, currentStatus,{task:"update-one"}).then((result) => {
		req.flash('success', notify.CHANGE_STATUS_SUCCESS, false);
		res.redirect(linkIndex);
	});
}); 
// Change status - Multi
router.post('/change-status/:status', (req, res, next) => {
	let currentStatus	= ParamsHelpers.getParam(req.params, 'status', 'active'); 
	CategoiesModel.changeStatus(req.body.cid,currentStatus, {task:"update-many"}).then((result) => {
		req.flash('success', util.format(notify.CHANGE_STATUS_MULTI_SUCCESS, result.n) , false);
		res.redirect(linkIndex);
	});
});


// Change ordering - Multi
router.post('/change-ordering', (req, res, next) => {
	let cids 		= req.body.cid;
	let orderings 	= req.body.ordering;

	CategoiesModel.changeOrdering(cids,orderings).then((result) => {
		req.flash('success', notify.CHANGE_ORDERING_SUCCESS, false);
		res.redirect(linkIndex);
	}); 
})	
// Delete
router.get('/delete/:id', (req, res, next) => {
	let id				= ParamsHelpers.getParam(req.params, 'id', ''); 	
	CategoiesModel.deleteItem(id,{task:"delete-one"}).then(( result) => {
		req.flash('success', notify.DELETE_SUCCESS, false);
		res.redirect(linkIndex);
	});
});

// Delete - Multi
router.post('/delete', (req, res, next) => {
	CategoiesModel.deleteItem(req.body.cid,{task:"delete-many"}).then((result) => {
		req.flash('success', util.format(notify.DELETE_MULTI_SUCCESS, result.n), false);
		res.redirect(linkIndex);
	});
});
// FORM
router.get(('/form(/:id)?'), (req, res, next) => {
	let id		= ParamsHelpers.getParam(req.params, 'id', '');
	let item	= {name: '', ordering: 0, status: 'novalue'};
	let errors   = null;
	if(id === '') { // ADD
		res.render(`${folderView}form`, { pageTitle: pageTitleAdd, item, errors});
	}else { // EDIT

		CategoiesModel.getItem(id).then((item) =>{
			res.render(`${folderView}form`, { pageTitle: pageTitleEdit, item, errors});
		});	
	}
});

// SAVE = ADD EDIT
router.post('/save', (req, res, next) => {
	req.body = JSON.parse(JSON.stringify(req.body));
	ValidateCategories.validator(req);

	let item = Object.assign(req.body);
	let errors = req.validationErrors();

	let taskCurrent = (typeof item !== 'undefined' && item.id !== '')? 'edit':'add'; 
	if(errors){
	let pageTitle = (taskCurrent == 'add')? pageTitleAdd: pageTitleEdit; 
	res.render(`${folderView}form`, { pageTitle: pageTitle, item, errors});
	} else {
		let message =(taskCurrent == 'add')? notify.ADD_SUCCESS: notify.EDIT_SUCCESS; 
		CategoiesModel.saveItem(item,{task:taskCurrent}).then((result) => {
			if(taskCurrent == 'add'){
				req.flash('success', message, false);
				res.redirect(linkIndex);
			} else if(taskCurrent == 'edit') {
				UsersModel.saveItem(item,{task:'change-group-name'}).then((result) => {
				req.flash('success', notify.EDIT_SUCCESS, false);
				res.redirect(linkIndex);
			}
		
		)};
	}
		)
}});
//SORT
router.get(('/sort/:sort_field/:sort_type'), (req, res, next) => {
	req.session.sort_field=  ParamsHelpers.getParam(req.params,'sort_field','ordering');
	req.session.sort_type =  ParamsHelpers.getParam(req.params,'sort_type','asc');
	res.redirect(linkIndex);
});

module.exports = router;
