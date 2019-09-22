### step 1

* ~~上传sequence并保存~~
* ~~上传文件并保存~~
* ~~将上传或处理后的文件调用predict.py, 并将结果文件保存~~
* ~~ 输出结果文件~~

todo: ~~解决两个子进程的顺序问题~~

### step 2

* ~~将job信息添加至数据库~~
* ~~eamil发送jobID， job完成后发送email~~
  
### step 3
* ~~status显示任务信息~~
* search 数据库 （完成按id）
* 完成prediction后页面变化

RESTFUL ROUTES

name                 url                  verb            desc.
==========================================================================
INDEX               /                     GET         show the landing page
UPLOAD              /upload               GET         show the upload page
SEQPROCESS          /upload/sequence      POST        deal with sequence, then redirect
FILEPROCESS         /upload/file          POST        deal with uploaded file, then redirect
JOBINFO             /upload/:id           GET         show the current job info to user
SEARCH              /jobs                 GET         show the page to search jobs
DRAW                /jobs/:id             POST        get job from database, then rediredct
SHOW                /jobs/:id             GET         show the result
JOBSLIST            /jobs/all             GET         show all tasks info


var jobInfoSchema = new mongoose.Schema({
	nickName: String,
	sequence: String,
	file: String,
	email: String,
	status: String,
	finishedTime: Date
});