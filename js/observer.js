function Observer(data) {
    this.data = data;
    // 开始对data监视
    this.walk(data);
}

Observer.prototype = {
    constructor: Observer,
    walk: function(data) {
        // 保存observer对象
        var me = this;
        // 遍历data中所有属性
        Object.keys(data).forEach(function(key) {
            // 对指定的属性进行数据劫持（实现响应式的数据绑定）
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        // 创建属性对应的dep对象，
        var dep = new Dep();
        // 通过间接的递归调用实现对data中所有层次属性的数据劫持
        var childObj = observe(val);
        // getdata重新定义属性，添加set/get方法
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() {//建立dep与watcher之前的关系
                if (Dep.target) {
                    dep.depend();// 建立关系
                }
                return val;
            },
            set: function(newVal) {// 监视key属性的变化。，更新界面
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知所有相关的订阅者（watcher）
                debugger
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    // 被观察的对象必须是一个对象
    if (!value || typeof value !== 'object') {
        return;
    }
    // 每一个被观察的属性创建Observer，
    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    // 添加watcher到dep中，建立watcher和dep的关系
    addSub: function(sub) {
        this.subs.push(sub);
    },
    // 建立watcher和dep的关系
    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        // 遍历所有的watcher，通知watcher更新
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};

Dep.target = null;