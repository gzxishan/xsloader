# xsloader
xsloader is a JavaScript file and module loader like requirejs but not requirejs[]()
## Documentation:[Wiki](//github.com/gzxishan/xsloader/wiki)

# 公司(Company)
[贵州溪山科技有限公司](http://www.xishankeji.com)

# 安装
### 1.初始化
```
npm install
```
### 2.构建
```
npm run build:all
```

## 发布记录
### v进行中

### v1.1.28 2020/06/24
1. 解决ifmsg重复onConnect的问题；
2. 解决ifmsg的client实例作为vue变量时，导致iframe跨域问题的bug；
3. 3. 完善`<jsx>`，x属性可以为空；

### v1.1.25 2020/05/18
1. 模块对象增加appendArgs(url,forArgsUrl)；
2. 增加`ifmsg`；
3. 配合xsloader4j，支持`*.htmv`；