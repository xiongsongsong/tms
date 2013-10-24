/**
 * Created by 松松 on 13-10-24.
 */

define(function (require, exports, module) {
    var $container = $('#main-container')

    $container.on('mousedown', 'div.J-row', function (ev) {
        var target = ev.target;
        var $currentTarget = $(ev.currentTarget);
        var $excel = $currentTarget.parents('div.excel')
        var $input = $currentTarget.parent().find('.J-input')
        var position = $currentTarget.position()
        var $fields = $excel.find('div.excel-field li.field')

        //判断当前点击的第几列
        //首先获取列的坐标信息

        var arr = []
        $fields.each(function (index, item) {
            arr.push([$(item).position().left, $(item).position().left + item.offsetWidth])
        })

        var index = 0;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][1] >= ev.offsetX) {
                index = i
                break;
            }
        }

        console.log(index)

        $input.css({
            left: arr[index][0],
            top: position.top,
            width: arr[index][1] - arr[index][0],
            height: $currentTarget.height()
        })
    })

    function getCurrentColsIndex() {

    }

})


