<ul id="tab-area">
    #each(group in tabArr)<li data-group-trigger="#{group}">#{group}</li>#end
</ul>
<div id="main-container">
    #each(group in tabArr)
    <div data-group="#{group}">

    </div>
    #end
</div>