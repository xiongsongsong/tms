/**
 * Created by 松松 on 13-10-16.
 */

define(function (require, exports, module) {
    var S = KISSY, DOM = S.DOM, Event = S.Event;

    var form = document.forms['origin-template']
    var $form = $(form)

    $form.on('submit', function (ev) {
        ev.preventDefault()
        $.post('/compile-template',
            $form.serialize(), function (data) {
                if (!data.err) {
                    alert('保存成功')
                } else {
                    alert('存在错误：\r\n' + S.JSON.stringify(data, undefined, '    '))
                }
            })
    })
})
