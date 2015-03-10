/**
 * @fileOverview Elastic Load Balancer Wizard JS
 * @requires AngularJS
 *
 */

wizardApp.controller('ELBWizardCtrl', function ($scope, $http, $timeout, eucaHandleError, eucaUnescapeJson) {
        $scope.elbForm = undefined;
        $scope.urlParams = undefined;
        $scope.isNotValid = true;
        $scope.securityGroupJsonEndpoint = '';
        $scope.elbName = '';
        $scope.vpcNetwork = '';
        $scope.vpcSubnet = '';
        $scope.vpcSubnetChoices = [];
        $scope.vpcSubnetList = [];
        $scope.securityGroups = [];
        $scope.securityGroupChoices = [];
        $scope.securityGroupCollection = []; 
        $scope.availabilityZones = [];
        $scope.crossZoneEnabled = false;
        $scope.protocolList = []; 
        $scope.pingProtocol = '';
        $scope.pingPort = '';
        $scope.responseTimeout = '';
        $scope.timeBetweenPings = '';
        $scope.failuresUntilUnhealthy = '';
        $scope.passesUntilUnhealthy = '';
        $scope.certificateRadioButton = '';
        $scope.certificateARN = '';
        $scope.certificateName = '';
        $scope.initController = function (optionsJson) {
            var options = JSON.parse(eucaUnescapeJson(optionsJson));
            $scope.setInitialValues(options);
            $scope.setWatcher();
            $scope.setFocus();
        };
        $scope.setInitialValues = function (options) {
            $scope.elbForm = $('#elb-form');
            $scope.urlParams = $.url().param();
            $scope.isNotValid = true;
            $scope.securityGroupJsonEndpoint = options.securitygroups_json_endpoint;
            if (options.hasOwnProperty('protocol_list')) {
                $scope.protocolList = options.protocol_list;
                if ($scope.protocolList instanceof Array && $scope.protocolList.length > 0) {
		    $scope.pingProtocol = $scope.protocolList[0].name;
                }
            }
            if (options.hasOwnProperty('default_vpc_network')) {
                $scope.vpcNetwork = options.default_vpc_network;
            }
            if (options.hasOwnProperty('vpc_subnet_choices')) {
                $scope.vpcSubnetList = options.vpc_subnet_choices;
                $scope.updateVPCSubnetChoices();
            }
            $scope.crossZoneEnabled = false;
            $scope.pingProtocol = 'HTTP';
            $scope.pingPort = 80;
            $scope.responseTimeout = 5;
            $scope.timeBetweenPings = 30;
            $scope.failuresUntilUnhealthy = 2;
            $scope.passesUntilUnhealthy = 10;
            $scope.certificateRadioButton = "existing";
            if ($('#certificates').children('option').length > 0) {
                $scope.certificateARN = $('#certificates').children('option').first().val();
            }
            $scope.initChosenSelectors(); 
        };
        $scope.initChosenSelectors = function () {
            $('#vpc_subnet').chosen({'width': '100%', search_contains: true});
            $('#securitygroup').chosen({'width': '100%', search_contains: true});
            $('#zone').chosen({'width': '100%', search_contains: true});
        };
        $scope.setWatcher = function (){
            // Handle the next step tab click event
            $scope.$on('eventClickVisitNextStep', function($event, nextStep) {
                $scope.checkRequiredInput(nextStep);
                // Signal the parent wizard controller about the completion of the next step click event
                $scope.$emit('eventProcessVisitNextStep', nextStep);
                $timeout(function() {
                    // Workaround for the broken placeholer message issue
                    // Wait until the rendering of the new tab page is complete
                    $('#zone').trigger("chosen:updated");
                    $('#vpc_subnet').trigger('chosen:updated');
                });
            });
            $scope.$on('eventOpenSelectCertificateModal', function() {
                $scope.openSelectCertificateModal();
            });
            $scope.$watch('elbName', function(){
               $scope.checkRequiredInput(1);
            });
            $scope.$watch('vpcNetwork', function () {
                $scope.getAllSecurityGroups($scope.vpcNetwork);
                $scope.updateVPCSubnetChoices();
            });
            $scope.$watch('securityGroupCollection', function () {
                $scope.updateSecurityGroupChoices();
            });
            $scope.$watch('certificateARN', function(){
                console.log($scope.certificateARN);
                if ($('#hidden_certificate_arn_input').length > 0) {
                    $('#hidden_certificate_arn_input').val($scope.certificateARN);
                }
            });
        };
        $scope.setFocus = function () {
        };
        $scope.checkRequiredInput = function (step) {
            $scope.isNotValid = false;
            if (step === 1) {
                if ($scope.elbName === '') {
                    $scope.isNotValid = true;
                }
            }
            // Signal the parent wizard controller about the update of the validation error status
            $scope.$emit('updateValidationErrorStatus', $scope.isNotValid);
        };
        $scope.getAllSecurityGroups = function (vpc) {
            var csrf_token = $('#csrf_token').val();
            var data = "csrf_token=" + csrf_token + "&vpc_id=" + vpc;
            $http({
                method:'POST', url:$scope.securityGroupJsonEndpoint, data:data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(oData) {
                var results = oData ? oData.results : [];
                $scope.securityGroupCollection = results;
            }).error(function (oData) {
                eucaHandleError(oData, status);
            });
        };
        $scope.updateSecurityGroupChoices = function () {
            $scope.securityGroupChoices = {};
            if ($.isEmptyObject($scope.securityGroupCollection)) {
                return;
            }
            $scope.securityGroups = [];
            angular.forEach($scope.securityGroupCollection, function(sGroup){
                var securityGroupName = sGroup.name;
                if (sGroup.name.length > 45) {
                    securityGroupName = sGroup.name.substr(0, 45) + "...";
                }
                $scope.securityGroupChoices[sGroup.id] = securityGroupName;
            }); 
            // Timeout is needed for chosen to react after Angular updates the options
            $timeout(function(){
                $('#securitygroup').trigger('chosen:updated');
            }, 500);
        };
        $scope.updateVPCSubnetChoices = function () {
            $scope.vpcSubnetChoices = {};
            $scope.vpcSubnet = '';
            angular.forEach($scope.vpcSubnetList, function(subnet){
                if (subnet.vpc_id === $scope.vpcNetwork) {
                    $scope.vpcSubnetChoices[subnet.id] = 
                        subnet.cidr_block + ' (' + subnet.id + ') | ' + 
                        subnet.availability_zone;
                    if ($scope.vpcSubnet === '') {
                        $scope.vpcSubnet = subnet.id;
                    }
                }
            }); 
            if ($scope.vpcSubnet === '') {
                $scope.vpcSubnetChoices.None = $('#hidden_vpc_subnet_empty_option').text();
                $scope.vpcSubnet = 'None';
            }
            // Timeout is needed for chosen to react after Angular updates the options
            $timeout(function(){
                $('#vpc_subnet').trigger('chosen:updated');
            }, 500);
        };
        $scope.openSelectCertificateModal = function () {
            var modal = $('#select-certificate-modal');
            if (modal.length > 0) {
                modal.foundation('reveal', 'open');
                $scope.certificateRadioButton = 'existing';
                $("#certificate-type-radio-existing").prop('checked', true);
                $("#certificates").val($scope.certificateARN);
            }
        };
        $scope.handleCertificateCreate = function ($event, url) {
            $event.preventDefault();
            if ($scope.certificateRadioButton === 'new') {
                $scope.createNewCertificate($event, url);
            }
            var modal = $('#select-certificate-modal');
            if (modal.length > 0) {
                modal.foundation('reveal', 'close');
            }
        };
        $scope.createNewCertificate = function ($event, url) {
            var formData = $($event.target).serialize();
            $scope.certificateForm = $('#select-certificate-form');
            $scope.certificateForm.trigger('validate');
            if ($scope.certificateForm.find('[data-invalid]').length) {
                return false;
            }
            var newCertificateName = $scope.certificateForm.find('#certificate_name').val();
            $http({
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: 'POST',
                url: url,
                data: formData
            }).success(function (oData) {
                Notify.success(oData.message);
                if (oData.id) {
                    var newARN = oData.id;
                    $('#certificates').append($("<option></option>")
                        .attr("value", newARN)
                        .text(newCertificateName));
                    $scope.certificateARN = newARN;
                    $scope.certificateName = newCertificateName;
                }
            }).error(function (oData) {
                eucaHandleError(oData, status);
            });
        };
        $scope.createELB = function () {
        };
    })
;

