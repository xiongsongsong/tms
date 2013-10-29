/**
 * Created by 松松 on 13-10-24.
 */

define(function (require, exports, module) {
    var $container = $('#main-container')

    $container.on('select selectstart', function (ev) {
        ev.preventDefault()
    })

    //插入新行
    $container.on('mousemove', 'div.excel-trigger-area', function (ev) {

        var $currentTarget = $(ev.currentTarget)
        var $excel = $currentTarget.parents('div.excel')

        if (!$excel.data('allRow')) {
            //获取当前行号
            $excel.data('allRow', $excel.find('.excel-container')[0].getElementsByTagName('div'))
            var allRow = $excel.data('allRow')
        } else {
            allRow = $excel.data('allRow')
        }
        var rowIndex = 0
        for (var i = 0; i < allRow.length; i++) {
            if ($(allRow[i]).position().top + allRow[i].offsetHeight > ev.offsetY) {
                rowIndex = i
                break;
            }
        }
        var control = $excel.find('div.J-add-delete-row')
        $(control).css({
            top: $(allRow[rowIndex]).position().top
        }).data('rowIndex', rowIndex)
    })

    $container.on('click', 'div.J-add-delete-row', function (ev) {
        var $target = $(ev.target)
        var $currentTarget = $(ev.currentTarget)
        var $excel = $currentTarget.parents('div.excel')

        if ($target.hasClass('J-add')) {
            $('<div class="J-row"></div>').insertBefore($excel.data('allRow')[$currentTarget.data('rowIndex')])
        }
        if ($target.hasClass('J-delete')) {
            if ($excel.data('allRow').length === 1) {
                alert('最后一行不能删除')
                return
            }
            $($excel.data('allRow')[$currentTarget.data('rowIndex')]).remove()
        }
    })


    //单击单元格
    $container.on('mousedown', 'div.excel-trigger-area', function (ev) {

        var $currentTarget = $(ev.currentTarget);
        var $excel = $currentTarget.parents('div.excel')
        var $inputWrapper = $excel.find('.J-input')
        var allRow = $excel.find('.excel-container')[0].getElementsByTagName('div')

        //保存行数的引用
        $excel.data('allRow', allRow)

        //保存$input，方便其他方法中调用
        $excel.data('inputFieldWrapper', $inputWrapper)
        $excel.data('inputField', $inputWrapper.find('textarea'))

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

        //获取当前行号
        var rowIndex = 0
        for (i = 0; i < allRow.length; i++) {
            if ($(allRow[i]).position().top + allRow[i].offsetHeight > ev.offsetY) {
                rowIndex = i
                break;
            }
        }

        //首先将数据刷入textarea，才更新列的信息
        if ($excel.data('position')) {
            exports.updateData($excel);
        }

        //存储字段的坐标，当前列，行信息
        $excel.data('position', {
            fieldsPosition: arr,
            colIndex: index,
            //获取点击的是第几行
            rowIndex: rowIndex
        })


        //将输入框定位到正确的单元格
        $excel.data('inputFieldPosition', {
            left: arr[index][0],
            top: $(allRow[rowIndex]).position().top,
            width: arr[index][1] - arr[index][0],
            height: allRow[rowIndex].offsetHeight
        })

        //定位输入框到正确的位置
        exports.setInputFieldPosition($excel)

    })

    //定位输入框
    exports.setInputFieldPosition = function ($excel) {
        $excel.data('inputFieldWrapper').css($excel.data('inputFieldPosition'))
        setTimeout(function () {
            $excel.data('inputField').focus()
        }, 100)
        //查看当前定位点，是否有数据，有则显示出来
        //获取当前的列索引
        var colIndex = $excel.data('position').colIndex
        //获取到当前的行
        var currentRow = $($excel.data('allRow')[($excel.data('position').rowIndex)])
        var val = currentRow.find('textarea[data-col-index=' + colIndex + ']').val()
        if (val) {
            $excel.data('inputField').val(val)
        } else {
            $excel.data('inputField').val('')
        }
    }

    //将输入框的数据刷入行中
    exports.updateData = function ($excel) {
        var inputFieldPosition = $excel.data('inputFieldPosition')
        var value = $excel.data('inputField').val()
        //获取当前的列索引
        var colIndex = $excel.data('position').colIndex
        var rowIndex = $excel.data('position').rowIndex
        //获取到当前的行
        var currentRow = $($excel.data('allRow')[rowIndex])
        if (colIndex === undefined || currentRow === undefined) return
        //检测是否已经有填充数据
        var $span = $('<textarea class="J-cell" data-col-index="' + colIndex + '" readonly>' + value + '</textarea>')
        if (currentRow.find('textarea[data-col-index=' + colIndex + ']').size() < 1) {
            delete inputFieldPosition.top
            $span.appendTo($excel.data('allRow')[rowIndex]).css(inputFieldPosition)
        } else {
            currentRow.find('textarea[data-col-index=' + colIndex + ']').val(value)
        }
    }

    exports.updateAll = function () {
        $('div.excel-trigger-area').each(function (index, item) {
            var $excel = $(item).parents('div.excel')
            if ($excel.data('inputFieldPosition')) {
                exports.updateData($excel)
            }
        })
    }
})


