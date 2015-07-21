/**
 * @name jquery.timescale.js jquery时间刻度插件
 * @author patson
 * @version 0.1.0
 * @date 2015-05-29
 * @description 展示全天24小时刻度的插件，可自定义刻度间隔和点击刻度回调事件
 *
 * 使用方式: $(container).timescale() 或 $(container).timescale(option)
 */
/**
 * AMD规范
 */
(function(factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory((typeof(jQuery) != 'undefined') ? jQuery : window.Zepto);
    }
}(function($) {
    "use strict";



    $.fn.timescale = function(options) {
        var opt = $.extend({}, $.fn.timescale.defaults, options);
        //获得container容器宽度
        var $container = $(this);
        var _container_width = $container.width();
        if(!opt.scale_spacing) {
            opt.scale_spacing = Math.floor((_container_width - 97) / 96);
        }

        //生成刻度尺dom结构
        var _axis = $('<div class="ts-axis"></div>'), //轴线
            _time_detail = $('<div class="ts-point-time"></div>'),//显示游标的具体时间容器，鼠标hover
            _cursor = $('<div class="ts-cursor"></div>').width(opt.scale_spacing); //刻度选中游标
        //计算每隔几个小刻度为一个大刻度，及所有刻度总数
        var _long_scale_tag = 60 / opt.minute_gap,
            _scale_count = 24 * _long_scale_tag;

        //往轴线上填充刻度
        for (var i = 0; i < _scale_count; i++) {
            //计算该刻度代表的时间点
            var time = calcScaleTime(i, opt.minute_gap);
            //刻度element
            var _scale = $('<span class="ts-scale" data-time="' + time + '"></span>');
            //根据配置设置刻度样式
            _scale.width(opt.scale_spacing);
            _scale.height(opt.short_scale_height).css('margin-top', -(opt.short_scale_height - opt.offset));

            //是否为长刻度
            if (i % _long_scale_tag === 0) {
                //增加长刻度样式
                _scale.addClass('ts-scale-long').height(opt.long_scale_height).css('margin-top', -(opt.long_scale_height - opt.offset));
                //此长刻度是否需要显示刻度值
                if (i % (_long_scale_tag * opt.value_gap) === 0) {
                    _axis.append(_scale.append('<b>' + time + '</b>'));
                } else {
                    _axis.append(_scale);
                }
            } else {
                _axis.append(_scale);
            }
        }
        //填充最后刻度，现在固定为 24:00
        _axis.append($('<span class="ts-scale ts-scale-long ts-scale-end" data-time="24:00"><b>24:00</b></span>'));
        //添加游标和显示时间容器
        _axis.append(_cursor);
        _axis.append(_time_detail);

        //获得刻度数组
        var _scale_array = _axis.children('span.ts-scale');
        if(opt.prev){
            $(opt.prev).click(function(){
                prev();
                return false;
            });
        }
        if(opt.next){
            $(opt.next).click(function(){
                next();
                return false;
            });
        }

        //通过事件代理添加刻度事件
        _axis.delegate('span.ts-scale', 'mouseover', function(event) {
            var _scale = $(this);
            if(!_scale.hasClass('ts-scale-end')) {
                _scale.width(opt.scale_spacing - 1);
            }

            _time_detail.text(_scale.data('time'));
            var left = _scale_array.index(_scale) * (opt.scale_spacing + 1);
            _time_detail.css('left', left - _time_detail.outerWidth()/2);
            _time_detail.show();
        });
        _axis.delegate('span.ts-scale', 'mouseout', function(event) {
            var _scale = $(this);
            _time_detail.hide();
            if(!_scale.hasClass('ts-scale-end')) {
                _scale.width(opt.scale_spacing);
            }
        });
        _axis.delegate('span.ts-scale:not(.ts-scale-end)', 'click', function(event) {
            var _this = $(this);
            _this.addClass('active').siblings('span.active').removeClass('active');
            var left = (_scale_array.index(_this) * (opt.scale_spacing + 1) + 1);
            _cursor.css('left', left).show();
            //调用配置的点击事件
            opt.scale_click_func(_this, _this.data('time'), _this.next('span.ts-scale').data('time'));
            if(opt.next) {
                if(hasNext()) {
                    $(opt.next).removeClass(opt.disable);
                } else {
                    $(opt.next).addClass(opt.disable);
                }
            }
            if(opt.prev) {
                if(hasPrev()) {
                    $(opt.prev).removeClass(opt.disable);
                } else {
                    $(opt.prev).addClass(opt.disable);
                }
            }
        });
        //计算轴线长度
        _axis.width((_scale_array.length - 1) * (opt.scale_spacing + 1) + 2);

        $container.append(_axis);

        if(opt.init_time) {
            setTime(opt.init_time, true);
        } else {
            setTime('00:00');
        }
        function prev() {
            var scale = _axis.find('.ts-scale.active').prev();
            if(scale.length){
                scale.click();
            }
        }

        function next() {
            var scale = _axis.find('.ts-scale.active').next();
            if(scale.length && !scale.hasClass('ts-scale-end')){
                scale.click();
            }
        }

        function hasPrev() {
            var scale = _axis.find('.ts-scale.active').prev();
            return scale.length ? true : false;
        }

        function hasNext() {
            var scale = _axis.find('.ts-scale.active').next();
            return scale.length && !scale.hasClass('ts-scale-end') ? true : false;
        }

        function setTime(time, is_click) {
            var pos = timeToPos(time, opt.minute_gap);
            if(is_click) {
                _scale_array.eq(pos).click();
            }
        }

        return {
            setTime: setTime
        };
    };

    function calcScaleTime(index, gap) {
        var hour = (index * gap - (index * gap) % 60) / 60,
            minute = (index * gap) % 60;
        hour = hour < 10 ? '0' + hour : hour;
        minute = minute < 10 ? '0' + minute : minute;
        return hour + ':' + minute;
    }

    function timeToPos(time, gap){
        var timeArr = time.split(':'), hour = parseInt(timeArr[0], 10), minute = parseInt(timeArr[1], 10);
        return Math.floor(hour * 60 / gap + minute / gap);
    }
    /**
     * 插件可选配置timescale.defaults：
     *     @function scale_click_func           : 刻度点击回调函数，带有三个参数：
     *                                            1)_this:刻度本身 2)tart_time:刻度开始时间(string)例"08:00" 3)end_time:刻度结束时间(string)，例"08:15"
     *     @int      long_scale_height          : 长刻度高度，默认32px
     *     @int      short_scale_height         : 短刻度高度，默认24px
     *     @int      offset                     : 刻度偏移量（刻度值在轴线下方漏出的长度）,默认为4px
     *     @int      minute_gap                 : 时间刻度间隔，默认为15分钟
     *     @int      default_value_gap          : 显示刻度的间距，默认为2，即每隔2个长刻度现实刻度值（刻度只会显示在长刻度下）
     *     @int      default_scale_spacing      : 刻度间隔，默认为8px
     *     @boolean  is_show_all                : 在大分辨率下是否显示详细刻度值 ，必须与 show_all_width 一块使用，默认false
     *     @int      show_all_width             : 容器宽度大于此数值时，显示详细刻度值(is_show_all为false时不生效)，默认1024px
     *     @int      show_all_value_gap         : 显示详细刻度时的刻度间距，默认为1
     *     @int      show_all_scale_spacing     : 显示详细刻度时的刻度间隔，默认为15px
     *
     */
    $.fn.timescale.defaults = {
        scale_click_func: function(_this, start_time, end_time) {
            console.log('start:%s,end:%s', start_time, end_time);
        },
        minute_gap: 15,
        value_gap: 2,
        //scale_spacing: 8,
        long_scale_height: 32,
        short_scale_height: 24,
        offset: 4
        //init_time: '11:00',
        //prev: '#prevBtn',
        //next: '#nextBtn',
        //diasble: 'disabled'
    };
}));