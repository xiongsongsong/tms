#each(item in fields)
<div class="unit">
    <div class="title"><h2>#{item.title}</h2></div>
    <div class="excel">
        <div class="excel-field">
            <ul class="field">
                #each(field in item.fields)<li class="field" data-field="#{field.name}"><span>#{field.tip}</span><s></s></li>#end
            </ul>
        </div>
        <div class="excel-wrapper">
            <div class="J-input"><textarea class="J-input-field"></textarea></div>
            <div class="excel-container" data-row="#{item.row}" data-cols="#{item.fields.length}" data-id="#{item.id}">
                #js for(var __row=0;__row< item.row;__row++){ #end
                <div data-row="#{__row}" class="J-row"></div>
                #js } #end
            </div>
            <div class="excel-trigger-area"></div>
        </div>
    </div>
</div>
#end