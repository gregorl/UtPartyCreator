
var configureDynamicStyles = function(){
    $(".sectionContent").addClass("ui-corner-all");
}

var configureUi = function(){
    $(".button").button();
    $("input[type=button]").button();
}

var configureValidation = function(){
    $("form").validate();
    $("input, select").blur(function(){
       $(this).valid(); 
    });
}

var configureEquipmentEditor = function(){
    
    $( "#availableItemsPanel" ).accordion({
            autoHeight: false,
            collapsible: true,
            active: -1
        });
    
    $( "#cart" ).droppable({
        activeClass: "ui-state-default",
        hoverClass: "ui-state-hover",
        accept: ":not(.ui-sortable-helper)",
        drop: function( event, ui ) {
            var list = $(this).find("ul");
            var self = this;
            $(this).find( ".placeholder" ).remove();
            var item = $("<li class='eqItem' ></li>").html(ui.draggable.html());
            item.appendTo(list);
            
            var eqItemId = item.children(".itemId").text();
            var eqItem = Enumerable.From(Items).Single(function(x){ return x.id == eqItemId; });
            ViewModel.character().addItemToEquipment(eqItem);
            
            $("<a style='float: right;' ></a>")
            .text("Usuń")
            .click(function(){
                
                ViewModel.character().removeItemFromEquipment(eqItem);
                item.remove();
                
                if (list.children('li').length == 0){
                    list.append($('<li class="placeholder eqItem">Dodaj przedmioty</li>'));
                }  
            }).appendTo(item);
        }
    }).sortable({
        items: "li:not(.placeholder)",
        sort: function() {
            // gets added unintentionally by droppable interacting with sortable
            // using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
            $( this ).removeClass( "ui-state-default" );
        }
    });
}

function getAttribute(attrs, getter){
    return getter(attrs);
}

function CharacterSheetCanvas(character, context, sheetImg, nr){
    var self = this;
    self.character = character;
    self.context = context;
    self.sheetImg = sheetImg;
    self.sy = nr * self.sheetImg.height;
    
    self.fillText = function(text, x, y){
        self.context.fillText(text, x, y + self.sy);
    };
    
    self.draw = function(){
        self.context.drawImage(self.sheetImg, 0, self.sy, self.sheetImg.width, self.sheetImg.height);
        self.fillText("name", 42, 55);
        self.fillText("race", 42, 90);
        self.fillText("prof", 42, 130);
        self.fillText("ld", 20, 167);
        self.fillText("m", 39, 55);
        self.fillText("ws", 39, 55);                        
        self.fillText("s", 42, 55);
        self.fillText("sp", 42, 55);
        self.fillText("bs", 42, 90);
        self.fillText("t", 39, 55);
        self.fillText("w", 39, 55);
        self.fillText("zdolnosc rasy", 39, 55);
        self.fillText("zdolnosc profesji", 39, 55);                        
        self.fillText("bron", 42, 90);
        self.fillText("pancerz", 39, 55);
        self.fillText("ekwipunek", 39, 55);
        self.fillText("koszt", 39, 55);
    };
}

function printTeamCharacterSheets(){
    
    //if (!ViewModel || !ViewModel.team || ViewModel.team.characters().length == 0){
    //    return;
    //}
    
    //var characters = ViewModel.team.characters();
    var characters = [ 'a', 'a' ]; 
    var sheetWidth = 654;
    var sheetHeight = 239;
    
    var canvas = document.getElementById("charactersCanvas");
    $(canvas).attr("width", sheetWidth).attr("height", 239 * characters.length);
    
    var sheetImage = new Image();
    sheetImage.src = $("input[name=formImageData]").val();
    
    var context = canvas.getContext("2d");
    for (var i = 0; i < characters.length; i++){
        var charCanv = new CharacterSheetCanvas(characters[i], context, sheetImage, i);
        charCanv.draw();        
    }
    
}

function UtViewModel(){
    var self = this;

    self.team = new Team(ko.observable(), ko.observable())
    
    self.costCalculationPolicy = new CharacterCostCalculationPolicy(self.team);
        
    self.character = ko.observable(new Character(ko.observable(), ko.observable(), ko.observable(), self.costCalculationPolicy));

    self.availableRaces = ko.computed(function(){
            var teamNature = self.team.nature();
            var filteredRaces = Enumerable.From(Races)
                        .Where(function(x){
                            return x.availableNatures.indexOf(teamNature) != -1;
                        }).ToArray();
            
            return filteredRaces;
        });
        
    self.availableProfessions = ko.observableArray(Professions);
    
    self.availableMeleeWeapons = ko.computed(function(){
            return Enumerable.From(Items)
                .Where(function(x){
                    return x.type == ItemType.MeleeWeapon 
                            && x.canBeUsedBy(self.character());
                    }).ToArray();
        });
        
    self.availableRangedWeapons = ko.computed(function(){
            return Enumerable.From(Items)
                .Where(function(x){
                    return x.type == ItemType.RangedWeapon
                            && x.canBeUsedBy(self.character());
                    }).ToArray();
        });
                
    self.availableArmors = ko.computed(function(){
            return Enumerable.From(Items)
                .Where(function(x){
                    return (x.type == ItemType.Armor || 
                            x.type == ItemType.Helmet || 
                            x.type == ItemType.Shield || 
                            x.type == ItemType.Greaves)
                            && x.canBeUsedBy(self.character());
                    }).ToArray();
        });        
        
    self.pointsAvailable = ko.computed(function(){
            return self.team.points() - self.team.cost();
        });
        
    self.addCharacter = function(){
        var data = self.character();
        var character = new Character(
            ko.observable(data.name()),
            ko.observable(data.raceId()), 
            ko.observable(data.professionId()),
            self.costCalculationPolicy);
            
        ko.utils.arrayForEach(data.equipment(), function(e){
                character.equipment.push(e);
            });    
  
        self.team.characters.push(character);
    }
    
    self.removeCharacter = function(character){
        self.team.characters.remove(character);
    }
    
    self.setDraggable = function(){
            $( "#availableItemsPanel li" ).draggable({
                appendTo: "body",
                helper: "clone"
            });
    }
    
}

