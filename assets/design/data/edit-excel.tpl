#each(item in fields)
<div class="unit" data-row="#{item.row}" data-id="#{item.id}">
    <div class="title"><h2>#{item.title}</h2></div>
    <div class="excel">
        <ul class="field">
            #each(field in item.fields)<li class="field" data-field="#{field.name}">#{field.tip}</li>#end
        </ul>
        #js for(var __row=0;__row< item.row;__row++){ #end
        <div data-row="#{__row}" class="J-row"></div>
        #js } #end
    </div>
</div>
#end