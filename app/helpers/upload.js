const  multer  = require('multer'); 
const randomstring = require("randomstring");
const path = require('path');
const fs 	= require('fs');
let uploadFile =  (field,folderDes = 'users',length=5, fileSize = 4,fileExtension = 'jpeg|jpg|png') => {
	
    let storage = multer.diskStorage({
		destination:  (req, file, cb) => {
		  cb(null,__path_upload + folderDes);
		},
		filename:  (req, file, cb) => {
		  const uniqueSuffix = Date.now();
		  cb(null, randomstring.generate({length: length})+path.extname(file.originalname))
		}
	  });
	
	let upload = multer({ 
		storage: storage,
		limits: {fileSize: fileSize * 1024 * 1024},
		fileFilter: (req, file, cb) =>{
		const filetypes = new RegExp(fileExtension); 
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
		const mimetyp = filetypes.test(file.mimetype);
	if(mimetyp && extname){
	   return cb(null,true);
	}else {
		cb('Phần mở rộng không phù hợp');
	} }
	  }).single(field);
	  return upload
}
let removeFile = (folder,fileName) => {
	if(fileName != '' && fileName != undefined){
		let path = folder + fileName;
		if (fs.existsSync(path)){
			fs.unlink(path,(err) => {if (err) throw err; }); 
		  }
	}
}
module.exports = {
	upload: uploadFile,
	remove: removeFile
}