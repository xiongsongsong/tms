/**
 * Created by 松松 on 13-10-25.
 */

define(function (require, exports, module) {
    var form = document.forms['excel']
    var S = KISSY

    $(form).on('submit', function (ev) {

        $.post('/save-data', {data: S.JSON.stringify(getFormData())}, function (result) {
            console.log(result)
        })
        ev.preventDefault()
    })

    function getFormData() {
        var result = {}
        $('div.excel-container').each(function (index, item) {
            var $item = $(item)
            var colNum = $item.data('cols')

            var $row = $item.find('div.J-row')

            result[$item.attr('data-id')] = {
                colNum: colNum,
                fields: $item.attr('data-field'),
                data: []
            }

            //开始循环获取数据
            $row.each(function (i, row) {
                var $row = $(row)
                var _data = []
                for (var j = 0; j < colNum; j++) {
                    var val = $row.find('textarea[data-col-index=' + j + ']').val()
                    _data.push(val ? val : '')
                }
                //检查当前行是否有数据
                for (j = 0; j < colNum; j++) {
                    if (_data[j] !== '') {
                        result[$item.attr('data-id')].data.push(_data)
                        break;
                    }
                }
            })
        })
        return result
    }
})
