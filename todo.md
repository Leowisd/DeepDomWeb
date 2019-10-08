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
* ~~完成prediction后Jobinfo页面变化~~
* ~~chart 加虚线，超过部分变色, 隐藏X轴下标~~
* ~~chart size 适应话改变， 增加下载功能，增加显示序列功能~~
* ~~chart 改按button显示~~

### step 4
* ~~实现点击任务列表跳转结果显示界面, 分页效果~~
* ~~predict完成可直接点击任务号查看结果~~
* 添加404页面
* 解决外连样式问题

### step 5
* ~~增加zoom in/out 功能~~
* 添加drag to zoom和reset to default的按钮
* ~~修改sequence错误~~
* 更改tool tip 样式，改为显示附近的序列

### step 6
* 增加数据库自动清理功能


RESTFUL ROUTES

name                 url                  verb            desc.
==========================================================================
INDEX               /                     GET         show the landing page
UPLOAD              /upload               GET         show the upload page
SEQPROCESS          /upload/sequence      POST        deal with sequence, then redirect
FILEPROCESS         /upload/file          POST        deal with uploaded file, then redirect
JOBINFO             /upload/:id           GET         show the current job info to user
SEARCH              /jobs                 GET         show the page to search jobs
DRAW                /result               POST        get job from database, then rediredct
SHOW                /jobs/:id             GET         show the result
JOBSLIST            /jobs/all             GET         show all tasks info
DOWNLOAD			/jobs/download/:id   GET	      download the result file


var jobInfoSchema = new mongoose.Schema({
	nickName: String,
	sequence: String,
	file: String,
	email: String,
	status: String,
	finishedTime: Date
});