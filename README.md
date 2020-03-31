## 剖析Vue实现原理 - 如何实现双向绑定mvvm

**数据劫持:** vue.js 则是采用数据劫持结合发布者-订阅者模式的方式，通过`Object.defineProperty()`来劫持各个属性的`setter`，`getter`，在数据变动时发布消息给订阅者，触发相应的监听回调。


### 思路整理
vue是通过数据劫持的方式来做数据绑定的，其中最核心的方法便是通过`Object.defineProperty()`来实现对属性的劫持，达到监听数据变动的目的
整理了一下，要实现mvvm的双向绑定，就必须要实现以下几点：
1、实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
2、实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数
3、实现一个Watcher，作为连接Observer和Compile的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图
4、mvvm入口函数，整合以上三者

上述流程如图所示：
![图片](data:image/png;base64,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)

### 1、实现Observer
利用`Obeject.defineProperty()`来监听属性变动
那么将需要observe的数据对象进行递归遍历，包括子属性对象的属性，都加上	`setter`和`getter`
这样的话，给这个对象的某个值赋值，就会触发`setter`，那么就能监听到了数据变化。。相关代码可以是这样：
```javascript
var data = {name: 'kindeng'};
observe(data);
data.name = 'dmq'; // 哈哈哈，监听到值变化了 kindeng --> dmq

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    // 取出所有属性遍历
    Object.keys(data).forEach(function(key) {
	    defineReactive(data, key, data[key]);
	});
};

function defineReactive(data, key, val) {
    observe(val); // 监听子属性
    Object.defineProperty(data, key, {
        enumerable: true, // 可枚举
        configurable: false, // 不能再define
        get: function() {
            return val;
        },
        set: function(newVal) {
            console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
        }
    });
}

```
这样我们已经可以监听每个数据的变化了，那么监听到变化之后就是怎么通知订阅者了，所以接下来我们需要实现一个消息订阅器，很简单，维护一个数组，用来收集订阅者，数据变动触发notify，再调用订阅者的update方法，代码改善之后是这样：
```javascript
// ... 省略
function defineReactive(data, key, val) {
	var dep = new Dep();
    observe(val); // 监听子属性

    Object.defineProperty(data, key, {
        // ... 省略
        set: function(newVal) {
        	if (val === newVal) return;
            console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
            val = newVal;
            dep.notify(); // 通知所有订阅者
        }
    });
}

function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};
```
那么问题来了，谁是订阅者？怎么往订阅器添加订阅者？
我们已经明确订阅者应该是Watcher, 而且`var dep = new Dep();`是在 `defineReactive`方法内部定义的，所以想通过`dep`添加订阅者，就必须要在闭包内操作，所以我们可以在	`getter`里面动手脚：
```javascript
// Observer.js
// ...省略
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
		Dep.target && dep.addDep(Dep.target);
		return val;
	}
    // ... 省略
});

// Watcher.js
Watcher.prototype = {
	get: function(key) {
		Dep.target = this;
		this.value = data[key];	// 这里会触发属性的getter，从而添加订阅者
		Dep.target = null;
	}
}
```
这里已经实现了一个Observer了，已经具备了监听数据和数据变化通知订阅者的功能，[完整代码](https://github.com/DMQ/mvvm/blob/master/js/observer.js)。那么接下来就是实现Compile了

### 2、实现Compile
compile主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图，如图所示：

![Image text](https://raw.githubusercontent.com/hechenglong1108/mvvm/master/img/3.png)


因为遍历解析的过程有多次操作dom节点，为提高性能和效率，会先将vue实例根节点的`el`转换成文档碎片`fragment`进行解析编译操作，解析完成，再将`fragment`添加回原来的真实dom节点中
```javascript
function Compile(el) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}
Compile.prototype = {
	init: function() { this.compileElement(this.$fragment); },
    node2Fragment: function(el) {
        var fragment = document.createDocumentFragment(), child;
        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    }
};
```

compileElement方法将遍历所有节点及其子节点，进行扫描解析编译，调用对应的指令渲染函数进行数据渲染，并调用对应的指令更新函数进行绑定，详看代码及注释说明：

```javascript
Compile.prototype = {
	// ... 省略
	compileElement: function(el) {
        var childNodes = el.childNodes, me = this;
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;	// 表达式文本
            // 按元素节点方式编译
            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node) {
        var nodeAttrs = node.attributes, me = this;
        [].slice.call(nodeAttrs).forEach(function(attr) {
            // 规定：指令以 v-xxx 命名
            // 如 <span v-text="content"></span> 中指令为 v-text
            var attrName = attr.name;	// v-text
            if (me.isDirective(attrName)) {
                var exp = attr.value; // content
                var dir = attrName.substring(2);	// text
                if (me.isEventDirective(dir)) {
                	// 事件指令, 如 v-on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                	// 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
            }
        });
    }
};

// 指令处理集合
var compileUtil = {
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    // ...省略
    bind: function(node, vm, exp, dir) {
        var updaterFn = updater[dir + 'Updater'];
        // 第一次初始化视图
        updaterFn && updaterFn(node, vm[exp]);
        // 实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者watcher
        new Watcher(vm, exp, function(value, oldValue) {
        	// 一旦属性值有变化，会收到通知执行此更新函数，更新视图
            updaterFn && updaterFn(node, value, oldValue);
        });
    }
};

// 更新函数
var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }
    // ...省略
};
```
这里通过递归遍历保证了每个节点及子节点都会解析编译到，包括了{{}}表达式声明的文本节点。指令的声明规定是通过特定前缀的节点属性来标记，如`<span v-text="content" other-attr`中`v-text`便是指令，而`other-attr`不是指令，只是普通的属性。
监听数据、绑定更新函数的处理是在`compileUtil.bind()`这个方法中，通过`new Watcher()`添加回调来接收数据变化的通知

至此，一个简单的Compile就完成了。
接下来要看看Watcher这个订阅者的具体实现了

### 3、实现Watcher
Watcher订阅者作为Observer和Compile之间通信的桥梁，主要做的事情是:
1、在自身实例化时往属性订阅器(dep)里面添加自己
2、自身必须有一个update()方法
3、待属性变动dep.notice()通知时，能调用自身的update()方法，并触发Compile中绑定的回调，则功成身退。
```javascript
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
    this.value = this.get(); 
}
Watcher.prototype = {
    update: function() {
        this.run();	// 属性值变化收到通知
    },
    run: function() {
        var value = this.get(); // 取到最新值
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal); // 执行Compile中绑定的回调，更新视图
        }
    },
    get: function() {
        Dep.target = this;	// 将当前订阅者指向自己
        var value = this.vm[exp];	// 触发getter，添加自己到属性订阅器中
        Dep.target = null;	// 添加完毕，重置
        return value;
    }
};
// 这里再次列出Observer和Dep，方便理解
Object.defineProperty(data, key, {
	get: function() {
		// 由于需要在闭包内添加watcher，所以可以在Dep定义一个全局target属性，暂存watcher, 添加完移除
		Dep.target && dep.addDep(Dep.target);
		return val;
	}
    // ... 省略
});
Dep.prototype = {
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update(); // 调用订阅者的update方法，通知变化
        });
    }
};
```
实例化`Watcher`的时候，调用`get()`方法，通过`Dep.target = watcherInstance`标记订阅者是当前watcher实例，强行触发属性定义的`getter`方法，`getter`方法执行的时候，就会在属性的订阅器`dep`添加当前watcher实例，从而在属性值有变化的时候，watcherInstance就能收到更新通知。

 Watcher也已经实现了
基本上vue中数据绑定相关比较核心的几个模块也是这几个。

最后来讲讲MVVM入口文件的相关逻辑和实现吧，相对就比较简单了~

### 4、实现MVVM
MVVM作为数据绑定的入口，整合Observer、Compile和Watcher三者，通过Observer来监听自己的model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer和Compile之间的通信桥梁，达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果。

一个简单的MVVM构造器是这样子：
```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data;
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}
```

但是这里有个问题，从代码中可看出监听的数据对象是options.data，每次需要更新视图，则必须通过`var vm = new MVVM({data:{name: 'kindeng'}}); vm._data.name = 'dmq'; `这样的方式来改变数据。

显然不符合我们一开始的期望，我们所期望的调用方式应该是这样的：
`var vm = new MVVM({data: {name: 'kindeng'}}); vm.name = 'dmq';`

所以这里需要给MVVM实例添加一个属性代理的方法，使访问vm的属性代理为访问vm._data的属性，改造后的代码如下：

```javascript
function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data, me = this;
    // 属性代理，实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key) {
        me._proxy(key);
    });
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
	_proxy: function(key) {
		var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return me._data[key];
            },
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
	}
};

