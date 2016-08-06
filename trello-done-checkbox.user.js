// ==UserScript==
// @name         Trello done checkbox
// @version      0.7
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

 Works well with trello build-211 (6 August 2016).
 */
(function () {
    //Timeout for DOM elements to show up
    var TIMEOUT = 2500;

    //Shared variables
    var intervalID = null,
        $windowWrapper = null,
        $addChecklistButton = null,
        $addDoneButton = null;

    //Create 'Done' button just after dialog box is shown
    onDialogBoxActivation(showDoneButton);

    //Show 'Done' button.
    function showDoneButton() {
        //Locate tool bar
        var $windowSidebar = $windowWrapper.find('div.window-sidebar');
        check($windowSidebar.length > 0, "Failed to locate div with class 'window-sidebar'!");

        //Add 'Done' button after 'Checklist' button. It won't be added if 'Checklist' button doesn't exist - limited access to the board.
        var $tools = $windowSidebar.children().first();
        $addChecklistButton = $tools.find('a.js-add-checklist-menu');
        $addChecklistButton.after("<a class='button-link js-add-done-menu' href='#'><span class='icon-sm icon-checklist'></span> Done</a>");

        //Register click listener for 'Done' button.
        $addDoneButton = $tools.find('.js-add-done-menu');
        $addDoneButton.on("click", function () {
            createDoneCheckBox();
        });
    }

    //Create 'Done' checkbox (checklist named 'Done' with one element 'Done')
    function createDoneCheckBox() {
        var $item = null;

        execute([
            //step 1: click 'Checklist' button
            {
                condition: true,
                handler: function () {
                    $addChecklistButton[0].click();
                }
            },
            //step 2: wait for 'Add Checklist' dialog box then hide it
            {
                condition: function () {
                    return $('div.is-shown').length > 0;
                },
                handler: function () {
                    $('div.is-shown').removeClass("is-shown").addClass("is-hidden");
                },
                timeout: function () {
                    halt("Failed to locate div with class 'is-shown'");
                }
            },
            //step 3: set new checklist title to 'Done'
            {
                condition: function () {
                    return $('input[id=id-checklist]').length > 0;
                },
                handler: function () {
                    $('input[id=id-checklist]').val('Done');
                },
                timeout: function () {
                    halt("Failed to locate input with id=id-checklist");
                }
            },
            //step 4: click 'Add' button, hide any popup
            {
                condition: function () {
                    return $('input[type=submit].js-add-checklist').length > 0;
                },
                handler: function () {
                    $('input[type=submit].js-add-checklist').click();
                    $('div.is-shown').removeClass('is-shown').addClass('isHidden');
                },
                timeout: function () {
                    halt("Failed to located input with class 'js-add-checklist' and type 'submit'");
                }
            },
            //step 5: wait for a new checklist to appear, then hide it
            {
                condition: function () {
                    var $doneChecklist = $('div.checklist-list').children();
                    return $doneChecklist.length > 0 && $doneChecklist.last().html().indexOf(">Done<") !== -1;
                },
                handler: function () {
                    $item = $('div.checklist-list').children().last();
                    $item.find('.checklist-new-item').removeClass('focus').hide();
                },
                timeout: function () {
                    halt("Failed to locate div with class 'checklist-list'");
                }
            },
            //step 6: set new item description to 'Done'
            {
                condition: function () {
                    return $item.find('textarea.js-new-checklist-item-input').length > 0;
                },
                handler: function () {
                    $item.find('textarea.js-new-checklist-item-input').text('Done');
                },
                timeout: function () {
                    halt("Failed to locate textarea with class 'js-new-checklist-item-input'");
                }
            },
            //step 7: add a new item by clicking 'Add'
            {
                condition: function () {
                    return $item.find('input[type=submit].js-add-checklist-item').length > 0;
                },
                handler: function () {
                    $item.find('input[type=submit].js-add-checklist-item').click();
                },
                timeout: function () {
                    halt("Failed to locate input with class 'js-add-checklist-item' and type 'submit'");
                }
            },
            //step 8: close new item window
            {
                condition: function () {
                    return $item.find('a.js-cancel-checklist-item').length > 0;
                },
                handler: function () {
                    $item.find('a.js-cancel-checklist-item')[0].click();
                },
                timeout: function () {
                    halt("Failed to locate anchor with class 'js-cancel-checklist-item'");
                }
            }
        ]);
    }

    //Invokes listener after dialog box activation
    function onDialogBoxActivation(listener) {
        var dialogBoxWasActive = false;

        //Locate task dialog box div
        $windowWrapper = $('div.window-wrapper');
        check($windowWrapper.length > 0, "Failed to locate div with class 'window-wrapper'!");

        //Monitor dialog box state change
        intervalID = setInterval(function () {
            var dialogBoxActive = $windowWrapper.children().length > 0;
            if (dialogBoxActive && !dialogBoxWasActive) {
                listener();
            }
            else if (!dialogBoxActive) {
                unbindEventHandlers();
            }
            dialogBoxWasActive = dialogBoxActive;
        }, 250);
    }

    //Check precondition. If test fails an error message is shown to user.
    function check(condition, errorMessage) {
        if (!condition) {
            halt(errorMessage);
        }
    }

    //Write error to console, stop script 'main loop' and unbind event handlers.
    function halt(msg) {
        if (console && console.log) {
            console.log('[ERROR] ' + msg);
        }

        if (intervalID !== null) {
            clearInterval(intervalID);
        }
        unbindEventHandlers();
        console.log("Script trello-done-checkbox.user.js stopped working. Contact Dzafar Sadik <dzafar.sadik@gmail.com> to fix this issue.");
    }

    //Unbind event handlers for 'Done' button
    function unbindEventHandlers() {
        if ($addDoneButton !== null) {
            $addDoneButton.unbind();
            $addDoneButton = null;
        }
    }

    /*
     Accepts list of steps to be executed. Steps are run in order but function won't be called until step condition is met.
     It's possible to reach timeout while waiting for condition. In this case no further steps are performed and provided
     timeout handler gets called.

     Each step contains condition, step handler (optional) and timeout handler (optional).
     [{
     //we may be waiting for particular DOM node...
     condition: function() {
     return true;
     },

     //perform some action
     handler: function() {
     //... or do nothing, as you wish :)
     },

     //timeout reached, you may define this property but it's not required
     timeout: function() {
     console.log('Cannot locate DIV with class .SmartPigeon!');
     }
     },
     //next steps?
     {
     //...
     }]

     */
    function execute(steps) {
        execute(steps, time());
        function execute(steps, startTime) {
            if (steps !== undefined && steps !== null && steps.length > 0) {
                setTimeout(function () {
                    var step = steps[0];
                    //condition fulfilled: execute step handler
                    if (step.condition === true || step.condition() === true) {
                        if (step.handler !== undefined && step.handler !== null) {
                            step.handler();
                        }
                        execute(steps.slice(1), time());
                    }
                    //timeout reached: execute timeout handler
                    else if (time() - startTime > TIMEOUT) {
                        if (step.timeout !== undefined && step.timeout !== null) {
                            step.timeout();
                            return; //next steps won't be executed
                        }
                    }
                    //wait for condition
                    else {
                        execute(steps, startTime);
                    }
                }, 0);
            }
        }

        function time() {
            return new Date().getTime();
        }
    }
})();