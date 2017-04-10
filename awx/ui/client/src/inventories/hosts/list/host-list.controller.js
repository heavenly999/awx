/*************************************************
 * Copyright (c) 2017 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/


function HostsList($scope, HostsList, $rootScope, GetBasePath,
    rbacUiControlService, Dataset, $state, $filter, Prompt, Wait,
    HostManageService, SetStatus) {

    let list = HostsList;

    init();

    function init(){
        $scope.canAdd = false;
        $scope.activeHostSearch = false;

        rbacUiControlService.canAdd('hosts')
            .then(function(canAdd) {
                $scope.canAdd = canAdd;
            });

        // Search init
        $scope.list = list;
        $scope[`${list.iterator}_dataset`] = Dataset.data;
        $scope[list.name] = $scope[`${list.iterator}_dataset`].results;

        $rootScope.flashMessage = null;

        $scope.$watchCollection(list.name, function() {
            $scope[list.name] = _.map($scope.hosts, function(value) {
                value.inventory_name = value.summary_fields.inventory.name;
                value.inventory_id = value.summary_fields.inventory.id;
                return value;
            });
            setJobStatus();
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
            if(toParams && toParams.host_search) {
                let hasMoreThanDefaultKeys = false;
                angular.forEach(toParams.host_search, function(value, key) {
                    if(key !== 'order_by' && key !== 'page_size') {
                        hasMoreThanDefaultKeys = true;
                    }
                });
                $scope.activeHostSearch = hasMoreThanDefaultKeys ? true : false;
            }
            else {
                $scope.activeHostSearch = false;
            }
        });

    }

    function setJobStatus(){
        _.forEach($scope.hosts, function(value) {
            SetStatus({
                scope: $scope,
                host: value
            });
        });
    }

    $scope.createHost = function(){
        $state.go('hosts.add');
    };
    $scope.editHost = function(id){
        $state.go('hosts.edit', {host_id: id});
    };
    $scope.deleteHost = function(id, name){
        var body = '<div class=\"Prompt-bodyQuery\">Are you sure you want to permanently delete the host below from the inventory?</div><div class=\"Prompt-bodyTarget\">' + $filter('sanitize')(name) + '</div>';
        var action = function(){
            delete $rootScope.promptActionBtnClass;
            Wait('start');
            HostManageService.delete(id).then(() => {
                $('#prompt-modal').modal('hide');
                if (parseInt($state.params.host_id) === id) {
                    $state.go("hosts", null, {reload: true});
                } else {
                    $state.go($state.current.name, null, {reload: true});
                }
                Wait('stop');
            });
        };
        // Prompt depends on having $rootScope.promptActionBtnClass available...
        Prompt({
            hdr: 'Delete Host',
            body: body,
            action: action,
            actionText: 'DELETE',
        });
        $rootScope.promptActionBtnClass = 'Modal-errorButton';
    };

    $scope.toggleHost = function(event, host) {
        try {
            $(event.target).tooltip('hide');
        } catch (e) {
            // ignore
        }

        host.enabled = !host.enabled;

        HostManageService.put(host).then(function(){
            $state.go($state.current, null, {reload: true});
        });
    };

    $scope.smartInventory = function() {
        $state.go('hosts.addSmartInventory');
    };

}

export default ['$scope', 'HostsList', '$rootScope', 'GetBasePath',
    'rbacUiControlService', 'Dataset', '$state', '$filter', 'Prompt', 'Wait',
    'HostManageService', 'SetStatus', HostsList
];
