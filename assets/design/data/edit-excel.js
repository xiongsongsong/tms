/**
 * Created by 松松 on 13-10-24.
 */

define(function (require, exports, module) {
    var $container = $('#main-container')

    $container.on('mousedown', 'div.J-row', function (ev) {
        var $currentTarget = $(ev.currentTarget);
        var $excel = $currentTarget.parents('div.excel')
        var $inputWrapper = $currentTarget.parent().find('.J-input')
        var allRow = $excel.find('.excel-wrapper')[0].getElementsByTagName('div')

        //保存行数的引用
        $excel.data('allRow', allRow)

        //保存$input，方便其他方法中调用
        $excel.data('inputFieldWrapper', $inputWrapper)
        $excel.data('inputField', $inputWrapper.find('input'))

        var $fields = $excel.find('div.excel-field li.field')
        $excel.data('excelFields', $fields)

        var position = $currentTarget.position()
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

        //获取当前行数

        //存储字段的坐标，当前列，行信息
        $excel.data('position', {
            fieldsPosition: arr,
            colIndex: index,
            rowIndex: 1
        })

        //将输入框定位到正确的单元格
        $excel.data('inputFieldPosition', {
            left: arr[index][0],
            top: position.top,
            width: arr[index][1] - arr[index][0],
            height: $currentTarget.height()
        })

        //更新数据
        exports.updateData($excel);

        //定位输入框到正确的位置
        exports.setInputFieldPosition($excel)

    })

    //定位输入框
    exports.setInputFieldPosition = function ($excel) {
        console.log($excel.data('allRow').length)
        $excel.data('inputFieldWrapper').css($excel.data('inputFieldPosition'))
        setTimeout(function () {
            $excel.data('inputField').focus()
        }, 100)
    }

    //保存单元格数据
    exports.updateData = function ($excel) {

    }


})


