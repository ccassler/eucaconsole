/**
 * @fileOverview Launch Config Detail Page JS
 * @requires AngularJS
 *
 */

angular.module('LaunchConfigPage', [])
    .controller('LaunchConfigPageCtrl', function ($scope) {
        $scope.isHelpExpanded = false;
        $scope.toggleHelpContent = function () {
            $scope.isHelpExpanded = !$scope.isHelpExpanded;
        };
        $scope.initController = function () {
            $scope.setInitialValues();
            $scope.setWatch();
        };
        $scope.setInitialValues = function () {
        };
        $scope.setWatch = function () {
        };
    })
;



