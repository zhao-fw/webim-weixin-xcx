let WebIM = require("../../utils/WebIM")["default"];
let disp = require("../../utils/broadcast");
let runAnimation = true

var user = ["123", "12", "1"];

Page({
  data: {
    name: "",
    psd: "",
    grant_type: "password",
    rtcUrl: '',
    show_config: true, //默认不显示配置按钮
    isSandBox: false //默认线上环境
  },

  statechange(e) {
    console.log('live-player code:', e.detail.code)
  },
  error(e) {
    console.error('live-player error:', e.detail.errMsg)
  },

  onLoad: function (option) {
    const me = this;
    const app = getApp();
    new app.ToastPannel.ToastPannel();

    disp.on("em.xmpp.error.passwordErr", function () {
      me.toastFilled('用户名或密码错误');
    });
    disp.on("em.xmpp.error.activatedErr", function () {
      me.toastFilled('用户被封禁');
    });

    wx.getStorage({
      key: 'isSandBox',
      success(res) {
        console.log(res.data)
        me.setData({
          isSandBox: !!res.data
        })
      }
    })

    if (option.username && option.password != '') {
      this.setData({
        name: option.username,
        psd: option.password
      })
    }
  },

  // 绑定数据
  bindUsername: function (e) {
    this.setData({
      name: e.detail.value
    });
  },
  bindPassword: function (e) {
    this.setData({
      psd: e.detail.value
    });
  },

  login: function () {
    if (user.indexOf(this.data.name) < 0) {
      this.register(this.data.name, this.data.psd);
      console.log(1);
    }
    // runAnimation = !runAnimation
    // 将判断输入的内容全部删除了
    // 配置缓存（键值对key => data）
    wx.setStorage({
      key: "myUsername",
      data: this.data.name.toLowerCase()
    });

    // 连接IM服务器（到时候可以用openid注册）函数在app.js中实现
    getApp().conn.open({
      // apiUrl: WebIM.config.apiURL,
      user: this.data.name.toLowerCase(),
      pwd: this.data.psd,
      grant_type: this.data.grant_type,
      appKey: WebIM.config.appkey
    });
  },

  changeConfig: function () {
    this.setData({
      isSandBox: !this.data.isSandBox
    }, () => {
      wx.setStorage({
        key: "isSandBox",
        data: this.data.isSandBox
      });
    })

  },

  // 注册函数
  register: function (user, psd) {
    var options = {
      apiUrl: WebIM.config.apiURL,
      username: user.toLowerCase(),
      password: psd,
      nickname: "",
      appKey: WebIM.config.appkey,
      success: function (res) {
        console.log('注册成功', res)
        that.toastSuccess('注册成功'); // toast（吐司）：就是提示成功失败的小提示框
        var data = {
          apiUrl: WebIM.config.apiURL,
          user: that.data.username.toLowerCase(),
          pwd: that.data.password,
          grant_type: "password",
          appKey: WebIM.config.appkey
        };
        // 储存
        wx.setStorage({
          key: "myUsername",
          data: that.data.username
        });
      },
      error: function (res) {
        // 注册失败问题，注意别犯
        console.log('注册失败', res)
        if (res.statusCode == '400' && res.data.error == 'illegal_argument') {
          if (res.data.error_description === 'USERNAME_TOO_LONG') {
            return that.toastFilled('用户名超过64个字节！')
          }
          return that.toastFilled('用户名非法!')
        } else if (res.data.error === 'duplicate_unique_property_exists') {
          return that.toastFilled('用户名已被占用!')
        } else if (res.data.error === 'unauthorized') {
          return that.toastFilled('注册失败，无权限！')
        } else if (res.data.error === 'resource_limited') {
          return that.toastFilled('您的App用户注册数量已达上限,请升级至企业版！')
        } else {
          return that.toastFilled('注册失败')
        }

      }
    };
    // 调用该函数
    WebIM.conn.registerUser(options);
  }

});