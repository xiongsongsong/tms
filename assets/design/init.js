/**
 * Created by 松松 on 13-10-19.
 */

define(function (require, exports, module) {


    var $form = $(document.forms['update-source'])
    $form.on('submit', function (ev) {
        ev.preventDefault()
        console.log($form.serialize())
    })


})