// ==UserScript==
// @name         Trello done checkbox
// @version      0.8
// @description  Script adds 'Done' button to trello task dialog box. It speeds up creation of one element checklists with 'Done' checkbox.
// @author       Dzafar Sadik
// @website      https://pl.linkedin.com/in/dzafarsadik
// @supportURL   dzafar.sadik@gmail.com
// @namespace    http://tampermonkey.net/
// @match        https://trello.com/*
// @updateURL    https://github.com/JafarSadik/trello-done-checkbox/raw/master/trello-done-checkbox.user.js
// @downloadURL  https://github.com/JafarSadik/trello-done-checkbox/raw/master/trello-done-checkbox.user.js
// @grant        none
// @noframes

// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/*
 Installs 'Done' button in trello task dialog box.
 Works well with trello build-4109 (6 December 2019).
 */
(function () {
    var $windowWrapper = null, $addChecklistButton = null, $addDoneButton = null;

    onDialogBoxActivation(
        showDoneButtonWithOnClickAction(createDoneCheckBox)
    );

    //Invokes listener after dialog box activation
    function onDialogBoxActivation(listener) {
        var dialogBoxWasActive = false;

        //Locate task dialog box div
        $windowWrapper = $('div.window-wrapper');

        //Monitor dialog box state change
        setInterval(function () {
            var dialogBoxActive = $windowWrapper.children().length > 0;
            if (dialogBoxActive && !dialogBoxWasActive) {
                listener();
            } else if (!dialogBoxActive) {
                unbindEventHandlers();
            }
            dialogBoxWasActive = dialogBoxActive;
        }, 250);
    }

    function showDoneButtonWithOnClickAction(onClickAction) {
        return function () {
            //Locate tool bar
            var $windowSidebar = $windowWrapper.find('div.window-sidebar');

            //Add 'Done' button after 'Checklist' button. It won't be added if 'Checklist' button doesn't exist - limited access to the board.
            var $tools = $windowSidebar.children();
            $addChecklistButton = $tools.find('a.js-add-checklist-menu');
            $addChecklistButton.after("<a class='button-link js-add-done-menu' href='#'><span class='icon-sm icon-checklist'></span> Done</a>");

            //Register click listener for 'Done' button.
            $addDoneButton = $tools.find('.js-add-done-menu');
            $addDoneButton.on("click", function () {
                onClickAction();
            });
        }
    }

    function createDoneCheckBox() {
        // Click 'Checklist' button
        $addChecklistButton[0].click();

        // Hide 'Add Checklist' dialog box
        $('div.is-shown').removeClass("is-shown").addClass("is-hidden");

        // St new checklist title to 'Done'
        $('input[id=id-checklist]').val('Done');

        // Click 'Add' button, hide any popup
        $('input[type=submit].js-add-checklist').click();
        $('div.is-shown').removeClass('is-shown').addClass('isHidden');

        // Hide check list
        var $item = $('div.checklist-list').children().last();
        $item.find('.checklist-new-item').removeClass('focus').hide();

        // Set new item description to 'Done'
        $item.find('textarea.js-new-checklist-item-input').val('Done');

        // Add a new item by clicking 'Add'
        $item.find('input[type=submit].js-add-checklist-item').click();

        // Close new item window
        $item.find('a.js-cancel-checklist-item')[0].click();
    }

    function unbindEventHandlers() {
        if ($addDoneButton) {
            $addDoneButton.unbind();
            $addDoneButton = null;
        }
    }
})();