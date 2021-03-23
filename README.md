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
1. 完善`propertiesDeal`，当属性存在变量时，如果计算得到了新的属性newKey，且同级对象中不存在该newKey的属性才会替换；
2. 修复配置`urlArgs`处理bug；
3. 修复`xsloader.queryParam`获取参数为空字符串时没有使用默认值的问题；
4. 完善`ifmsg`，页面关闭时会主动调用close；

### v1.1.38 2021/01/04
1. 修复xshttp在multiPart为true下，参数为对象时未能进行转换的bug；
2. 加入`xsloader`.`__currentPath`属性，用于xsloader4j；
3. 加入`require().setTag()`,便于加载依赖报错时提供tag信息；
4. 修复`try!`插件加载模块失败之无法继续执行的bug；
5. 修复`dealPathMayAbsolute`协议处理bug；
6. 配置中加入`aliasPaths`属性，可配置模块别名，别名格式不以"."开头，可出现"/"字符；
7. `ifmsg`的`Server`增加单例模式；

### v1.1.31 2020/09/14
1. 增加`xsloader.hasDefined(name)`判断模块是否已经定义完成（此模块已被执行）；

### v1.1.30 2020/08/21
1. `<jsx>`支持字符串等内容；

### v1.1.29 2020/07/10
1. invoker增加scriptSrc(),包含地址参数的；

### v1.1.28 2020/06/24
1. 解决ifmsg重复onConnect的问题；
2. 解决ifmsg的client实例作为vue变量时，导致iframe跨域问题的bug；
3. 3. 完善`<jsx>`，x属性可以为空；

### v1.1.25 2020/05/18
1. 模块对象增加appendArgs(url,forArgsUrl)；
2. 增加`ifmsg`；
3. 配合xsloader4j，支持`*.htmv`；