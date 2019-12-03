## VERSION ONE

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
* ~~search 数据库~~
* ~~完成prediction后Jobinfo页面变化~~
* ~~chart 加虚线，超过部分变色, 隐藏X轴下标~~
* ~~chart size 适应话改变， 增加下载功能，增加显示序列功能~~
* ~~chart 改按button显示~~

### step 4
* ~~实现点击任务列表跳转结果显示界面, 分页效果~~
* ~~predict完成可直接点击任务号查看结果~~
* ~~添加404页面~~
* ~~解决外连样式问题~~

### step 5
* ~~增加zoom in/out 功能~~
* ~~添加drag to zoom和reset to default的按钮~~
* ~~修改sequence错误~~
* ~~添加列表搜索框功能~~
* ~~更改seq显示样式~~
* ~~增加多选功能~~
* ~~增加返回顶部功能(悬浮框)~~
* ~~增加chart导航~~
* ~~更改tool tip 样式，改为显示附近的序列~~

### step 6
* ~~增加数据库自动清理功能~~
* ~~增加查询结果不存在情况~~
* ~~更换数据传输~~

### step 7
* ~~增加存ip数据表~~
* ~~增加获取IP函数~~
* ~~增加等待执行列表~~
* ~~增加ip用户任务大小检测~~
* ~~客户端ip地址获取修改~~
* ~~增加用户删除任务功能~~
* ~~增加保存chart功能~~

### step 8
* ~~增加hmmscan功能~~
* ~~可视化hmmscan结果~~
* ~~fix 没有结果bug~~

### step 9
* ~~增加structure scan 功能~~
* ~~可视化结果~~
* ~~fix 响应超时bug~~
* ~~改进btn样式 & 图表矩形互相响应（同属一个family的seg rect 的响应）~~

## VERSION UPDATE
~~更改deepdom predict过程，command写进一脚本后整体调用~~ 

### Add run SCOP superfamily scripts in back-end
* ~~下载相关module并test~~
* ~~加进运行队列~~
* ~~修改 superfamily.pl 中文件名获取、命令的路径 和 ass3.pl 中的文件路径~~
* ~~新增convert2csv.py脚本，转化结果到csv文件~~

### Add run CATH scripts in back-end
* ~~下载相关module并test~~
* ~~编写perl脚本cath.pl运行整个pipline~~
* ~~修改assign_cath_superfamilies.py的两个文件路径~~
* ~~加进运行队列~~

### Redesign result showing page
* ~~SCOP 完成~~
* ~~CATH 完成~~
* ~~DEEPDOM 完成~~

### sciprts plugins
* 增加SCOP和CATH结果domain ID对应的名称，同时添加外联接


### ADD USER MAP AND STATISTIC ON INDEX PAGE

### ADD PAGE INSTRUCTION FUNCTION ON EACH PAGE

### step
* 整体UI设计规划/ footer
* 任务等待页设计
* 邮件样式设计

### step
* 上线测试

RESTFUL ROUTES

name                 url                  verb            desc.
==========================================================================
INDEX               /                     GET         show the landing page
UPLOAD              /upload               GET         show the upload page
SEQPROCESS          /upload/sequence      POST        deal with sequence, then redirect
FILEPROCESS         /upload/file          POST        deal with uploaded file, then redirect
JOBINFO             /upload/:id           GET         show the current job info to user

RESULT1             /result/id            POST        get job from database by id, then rediredct to result page
RESULT2             /result/name          POST        get job from database by nick name, then rediredct to result list
RESULT3             /result/seq           POST        get job from database by sequence, then rediredct to result list

SEARCH              /jobs                 GET         show the page to search jobs
SHOW                /jobs/:id             GET         show the result
JOBSLIST            /jobs/all             GET         show all tasks info
DOWNLOAD			/jobs/download/:id    GET	      download the result file
DELETE				/jobs/delete/:id	  POST		  delete the selected job

SCOP				/process/scop/:id	  POST		  get current job scop result
CATH				/process/cath/:id	  POST		  do the gene3D hmmscan of post seq


var jobInfoSchema = new mongoose.Schema({
	nickName: String,
	sequence: String,
	file: String,
	email: String,
	status: String,
	finishedTime: Date,
	ipAddress: String
});

var userInfoSchema = new mongoose.Schema({
	ipAddress: String,
	capacity: Number
});
