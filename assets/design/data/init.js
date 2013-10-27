/**
 * Created by 松松 on 13-10-23.
 */

define(function (require, exports, module) {

    var tpl = require('./edit-tpl.tpl')
    var excelTpl = require('./edit-excel.tpl')
    require('./edit-excel.css')

    var S = KISSY;
    var template = require('template')
    var tabArr = [];

    var $container = $('#editFormWrapper')
    S.each(cf.arr, function (item) {
        if (S.indexOf(item.tab.group, tabArr) < 0) {
            tabArr.push(item.tab.group)
        }
    })

    $container.html(template.render(tpl, {tabArr: tabArr}))

    //当点击tab的时候，构造表单
    var $tab = $('#tab-area')
    $tab.on('click', 'li[data-group-trigger]', showExcel)

    $tab.find('li[data-group-trigger]').eq(0).trigger('click', showExcel)

    //切换tab，并构造表单

    function showExcel(ev) {
        var target = ev.currentTarget

        $(target).addClass('active').siblings('li').removeClass('active')

        var group = $(target).attr('data-group-trigger')
        var fields = S.map(getFields(group), function (item) {
            return {
                id: item.tab.id,
                title: item.tab.title,
                row: item.tab.row,
                defaultRow: item.tab.defaultRow,
                fieldsSum: S.keys(item.fields).join(','),
                fields: S.map(S.keys(item.fields), function (key) {
                    return {
                        key: key,
                        type: item.fields[key].type,
                        tip: item.fields[key].tip
                    }
                })
            }
        })
        var $wrapper = $container.find('[data-group=' + group + ']')
        if ($wrapper.data('is-build') !== true) {
            $wrapper.html(template.render(excelTpl, {fields: fields})).data('is-build', true)
        }
        //隐藏所有表格，显示当前表格
        $container.find('[data-group]').hide().filter('[data-group=' + group + ']').show()

        changeFieldsWidth()

    }

    //传入group，返回包含该group的所有对象
    function getFields(group) {
        var fields = []
        S.each(cf.arr, function (item) {
            if (item.tab.group === group) fields.push(item)
        })
        console.log(fields)
        return fields
    }

    //调整字段的宽度
    function changeFieldsWidth() {
        var $ul = $container.find(':visible[data-group] ul.field')
        $ul.each(function (index, item) {
            var $li = $(item).find('li')
            $li.width(parseInt(item.offsetWidth / $(item).find('li').size(), 10))
        })
    }

    $(window).on('resize', changeFieldsWidth)

    //处理具体的编辑业务
    require('./edit-excel')

    //保存数据
    require('./save-data')

})
