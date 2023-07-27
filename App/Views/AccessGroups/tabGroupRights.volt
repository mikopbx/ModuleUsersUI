<div class="ui grid">
    <div class="four wide column">
        <div class="ui vertical fluid tabular menu" id="access-settings-tab-menu">
            {% for module, types in groupRights %}
                {% if loop.first %}
                    <a class="active item"
                {% else %}
                    <a class="item"
                {% endif %}
                                    data-tab="{{ module }}Tab"><i class="icon"></i> {{ t._('Breadcrumb'~module) }}</a>
            {% endfor %}
        </div>
    </div>
    <div class="twelve wide column" id="access-group-rights">
        {% for module, types in groupRights %}
        <!-- Begin {{ module }} -->
                <div class="ui tab  {% if loop.first %}active{% endif %} segment" data-tab="{{ module }}Tab">
                    <button class="ui float right action label button check"><i class="check icon"></i>Пометить все</button>
                    <button class="ui float right action label button uncheck"><i class="eraser icon"></i>Очистить все</button>
                {% for type, controllers in types %}
                <div class="ui header">{{ t._('module_usersui_AppType'~type) }}</div>
                {% for controller, actions in controllers %}
                    <div class="field">
                        <div class="ui relaxed list">
                            <div class="item">
                                    <div class="ui master checkbox">
                                        {{ form.render(controller~'_main') }}
                                        {{ form.label(controller~'_main') }}
                                    </div>
                                    <div class="list">
                                        {% for element in form %}
                                            {% if element.getAttribute('data-module') === module and element.getAttribute('data-controller') === controller %}
                                                <div class="item">
                                                    <div class="ui child checkbox">
                                                        {{ element.render() }}
                                                        <label>{{ element.getLabel() }}</label>
                                                    </div>
                                                </div>
                                            {% endif %}
                                        {% endfor %}
                                    </div><!--list -->
                            </div><!--item -->
                        </div><!--ui list -->
                    </div><!--field -->
                {% endfor %}
                {% endfor %}
            </div> <!--ui tab segment -->
            <!-- {{ module }} end-->
            {% endfor %}

        </div>
    </div>