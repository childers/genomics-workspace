/**
 * Created by yu-yu.lin on 11/4/2015.
 */
$(document).ready(function() {

    //implement callback for datatable after drawing
    var timer_userTable;
    var timer_groupTable;
    var is_usertable_finish_load = false;
    var is_grouptable_finish_load = false;

    //error alert
    function errorAlert(text){
        BootstrapDialog.alert({
            title: 'ERROR',
            message: text,
            type: BootstrapDialog.TYPE_DANGER,
        });
    }

    //pre-load data
    var availableUsers = [];
    function loadAllGroups(){
        $.getJSON(I5K_URL + '/sso/get_all_groups', function(data){
            $('#all-groups').val(data);
        });
    }

    function func_timer(flag, t_table){
        if(flag){
            t_table.$('tr.selected').click();
            for(i=0; i<9999; i++){clearInterval(i);}
        }
    }

    //cookie handlers
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    var csrftoken = getCookie('csrftoken');

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    //DataTable Setting
    var table;
    var is_myUser_loaded = false;

    $('#myUserTab').on('click',function(){
        if(is_myUser_loaded == true)return;
        is_myUser_loaded = true;

        table = $('#userTable').DataTable({
            "processing":true,
            "paging":true,
            "deferRender": true,
            "ajax": {
                "url" : I5K_URL + '/sso/get_users',
                "dataSrc": ""
            },
            "columns": [
                {"data":"username"},
                {"data":"firstName"},
                {"data":"lastName"},
                {"data":"role"},
                {"data":"groups[,].name"},
                {"data":"groups[,].name"},
                {"data":"userId"},
                {"data":"djangoUser"},
            ],
            rowId:'userId',
            select: true,
            dom: 'Bfrtip',
            "columnDefs": [{
                "aTargets": [4], // Column to target
                "mRender": function ( data, type, full ) {
                    text = '';
                    show_count = 0;
                    var str = data.split(",");
                    for (i = 0; i < str.length; i++){
                        var patt = /GROUP_(\w+)_ADMIN/g;
                        if(patt.test(str[i]) == true){
                            show_count++;
                            var organism = str[i].split("_")[1];
                            text += organism + ", ";
                        }
                    }
                    return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                }},{
                "aTargets": [5], // Column to target
                "mRender": function ( data, type, full ) {
                    text = '';
                    show_count = 0;
                    var str = data.split(",");
                    for (i = 0; i < str.length; i++){
                        var patt = /GROUP_(\w+)_USER/g;
                        if(patt.test(str[i]) == true){
                            show_count++
                            var organism = str[i].split("_")[1];
                            text += organism + ", ";
                        }
                    }
                    return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                }},
            ],
            "order": [[ 6, "asc" ]],
            "fnInitComplete": function (oSettings) {
                loadAllGroups();
                resetUserDetail();
                //pre-load data of user list
                for (i = 0; i < table.column(0, {order:'current'}).data().length; i++){
                    availableUsers[i] = table.column(0, {order:'current'}).data()[i];
                }
                availableUsers.sort();

            },
            "fnDrawCallback": function (oSettings) {
                is_usertable_finish_load = true;
            },
        });
    });

    $('a.toggle-vis').on( 'click', function (e) {
            e.preventDefault();
            var column = table.column( $(this).attr('data-column') );
            column.visible( ! column.visible() );
    });

    $('#userTable').delegate('tbody tr','click',function() {
        resetUserDetail();

        if(!$(this).hasClass('selected')){
            return;
        } 

        $('#user-name').val(table.cell(table.row(this).index(),0).data());
        $('#first-name').val(table.cell(table.row(this).index(),1).data());
        $('#last-name').val(table.cell(table.row(this).index(),2).data());
        $('#user-role').val(table.cell(table.row(this).index(),3).data());
        $('#django-user-name').val('');
        $('#user-password').val('');

        text = "";
        str = table.cell(table.row(this).index(),4).data().split(",");
        if(str != ""){
            for (i = 0; i < str.length; i++){
                
                var patt = /GROUP_(\w+)/g;
                if(patt.test(str[i]) == true){
                    var shortgname = str[i].substring(6,14);
                    text += "<button type='button' class='btn btn-success user-group-button' value='" + str[i] + "'>" + shortgname + "</button> ";
                }
            }
        }
        $('#user-group-now-group').html(text);

        text = "";
        var str = $('#all-groups').val().split(",");
        var groupin = table.cell(table.row(this).index(),4).data().split(",");

        for (i = 0; i < str.length; i++){
            if($.inArray(str[i], groupin) == -1){
                var patt = /GROUP_(\w+)/g;
                if(patt.test(str[i]) == true){
                    var shortgname = str[i].substring(6,14);
                    text += "<button type='button' class='btn btn-gray user-group-button' value='" + str[i] + "'>" + shortgname + "</button> ";
                }
            }
        }
        $('#user-group-avaiable-group').html(text);
    } );


    $('#user-group').delegate('.user-group-button','click',function(){
        if(typeof(table.row(table.$('tr.selected')).index()) == 'undefined'){
            return;
        }

        userId = table.cell(table.row(table.$('tr.selected')).index(),6).data();
        userName = table.cell(table.row(table.$('tr.selected')).index(),0).data();
        groupName = $(this).val();

        //$('.user-group-button').addClass('disabled');
        if($(this).hasClass('btn-success') == true){
            $(this).removeClass('btn-success');
            $(this).addClass('btn-gray');

            $.ajax({
                type: "POST",
                url: I5K_URL + '/sso/remove_user_from_group',
                data: { groupName: groupName ,userId: userId},
                success: function(data){
                    is_usertable_finish_load = false;
                    table.ajax.reload(null, false);
                    setInterval(function(){func_timer(is_usertable_finish_load, table)}, 10);
                }
            });

        }else if($(this).hasClass('btn-gray') == true){
            $(this).removeClass('btn-gray');
            $(this).addClass('btn-success');

            $.ajax({
                type: "POST",
                url: I5K_URL + '/sso/add_user_to_group',
                data: { groupName: groupName , user: userName, userId: userId},
                success: function(data){
                    is_usertable_finish_load = false;
                    table.ajax.reload(null, false);
                    setInterval(function(){func_timer(is_usertable_finish_load, table)}, 10);
                }
            });
        }
    });

    //myGroup
    var table_group;
    var is_myGroup_load = false;
    $('#myGroupTab').on('click',function(){
        if(is_myGroup_load == true)return;
        is_myGroup_load = true;

        table_group = $('#groupTable').DataTable({
            "ajax": {
                "url" : I5K_URL + '/sso/get_groups',
                "dataSrc": ""
            },
            "columns": [
                {"data":"name"},
                {"data":"numberOfUsers"},
                {"data":"fullname"},
                {"data":"public"},
                {"data":"id"},
                {"data":"users[,].email"},
                {"data":"permission.permissions"}
            ],
            rowId:'id',
            select: true,
            dom: 'Bfrtip',
            "order": [[ 0, "asc" ]],
            "fnDrawCallback": function (oSettings) {
                is_grouptable_finish_load = true;
            },
        });
        table_group.column(5).visible(false);
    });

    $('#groupTable').delegate('tbody tr','click',function(){

        $('#group-reset-button').click();

        if(!$(this).hasClass('selected')){
            return;
        }         

        groupName = table_group.cell(table_group.row(this).index(),0).data();
        var organism = '';
        var patt = /GROUP_(\w+)_USER|GROUP_(\w+)_ADMIN/g;
        if(patt.test(groupName) == true){
            organism = groupName.split("_")[1];
        }

        $('#group-name').val(organism);
        $('#group-admin-name').text("GROUP_" + organism + "_ADMIN");
        $('#group-user-name').text("GROUP_" + organism + "_USER");

        text = "";
        str = table_group.cell(table_group.row(this).index(),5).data().split(",");
        if(str != ""){
            for (i = 0; i < str.length; i++){
                text += "<button type='button' class='btn btn-success group-member-button' value='" + str[i] + "'>" + str[i] + "</button> ";
            }
        }
        $('#group-member-now-member').html(text);

        text = "";
        permissons = table_group.cell(table_group.row(this).index(),6).data();
        perms = ['READ','WRITE','EXPORT'];
        for (i = 0; i < perms.length; i++){
            if(permissons.indexOf(perms[i]) > -1){
                text += "<button type='button' class='btn btn-success group-permission-button' id = '" + perms[i] + "' value='" + perms[i] + "'>" + perms[i] + "</button> ";
            }else{
                text += "<button type='button' class='btn btn-gray group-permission-button' id = '" + perms[i] + "' value='" + perms[i] + "'>" + perms[i] + "</button> ";
            }
        }

        $('#group-permissions').html(text);
    });

    $('#group-member').delegate('.group-member-button','click',function(){
        if(typeof(table_group.row(table_group.$('tr.selected')).index()) == 'undefined'){return;}

        groupName = table_group.cell(table_group.row(table_group.$('tr.selected')).index(),0).data();
        userName = $(this).val();
        $('.group-member-button').addClass('disabled');
        if($(this).hasClass('btn-success') == true){
            $(this).removeClass('btn-success');
            $(this).addClass('btn-gray');

            $.ajax({
                type: "POST",
                url: I5K_URL + '/sso/remove_user_from_group',
                data: { groupName: groupName ,userName: userName},
                success: function(data){
                    is_grouptable_finish_load = false;
                    table_group.ajax.reload(null, false);
                    setInterval(function(){func_timer(is_grouptable_finish_load, table_group)}, 10);
                }
            });
        }
    });

    $('#group-organism').delegate('.group-permission-button','click',function(){
        var read_p;
        var write_p;
        var export_p;

        if($(this).hasClass('btn-success')){
            $(this).removeClass('btn-success');
            $(this).addClass('btn-gray');
        }else{
            $(this).removeClass('btn-gray');
            $(this).addClass('btn-success');
        }

        var fullName = table_group.cell(table_group.row(table_group.$('tr.selected')).index(),2).data();
        var groupName = table_group.cell(table_group.row(table_group.$('tr.selected')).index(),0).data();

        if($("#READ").hasClass('btn-success')){
            read_p = true;        
        }else{read_p = false;}

        if($("#WRITE").hasClass('btn-success')){
            write_p = true;        
        }else{write_p = false;}

        if($("#EXPORT").hasClass('btn-success')){
            export_p = true;        
        }else{export_p = false;}


        $.ajax({
            type: "POST",
            url: I5K_URL + '/sso/update_group_permissions',
            data: {read_p : read_p, write_p : write_p, export_p : export_p, fullName : fullName, groupName : groupName},
            success: function(data){
                table_group.ajax.reload(null, false);
            }
        });
    });

    var table_myReqHist;
    var is_myInfo_loaded = false;
    $('#myInfoTab').on('click', function(){
        if(is_myInfo_loaded)return;
        table_myReqHist = $('#myReqHist').DataTable({
        "processing":true,
        //"serverSide": true,
        "ajax": {
            "url" : I5K_URL + '/sso/get_my_reqhist',
            "dataSrc": ""
        },
        "columns": [
            {"data":"req_type"},
            {"data":"oname"},
            {"data":"apply_date"},
            {"data":"apply_note"},
            {"data":"reply_date"},
            {"data":"reply_note"},
            {"data":"reply_user"},
            {"data":"status"},
        ],
        "order": [[ 7, "asc" ]],
        "columnDefs": [{
            "aTargets": [3],
            "mRender": function ( data, type, full ) {
                if(data != ''){
                    return "<button type='button' class='btn btn-default apply-desc-button' data-content='" + data + "'>Desc</button>";
                }else{
                    return '';
                }
            }},
            {
            "aTargets": [5],
            "mRender": function ( data, type, full ) {
                if(data != ''){
                    return "<button type='button' class='btn btn-default apply-desc-button' data-content='" + data + "'>Desc</button>";
                }else{
                    return '';
                }
            }}
        ],
        "fnInitComplete": function (oSettings) {
            is_myInfo_loaded = true; 
        },
        });
    });

 

    var is_preq_loaded = false;
    $('#pReqTab').on('click', function(){
        if(is_preq_loaded)return;
        var table = $('#preqTable').DataTable({
        "processing":true,
        //"serverSide": true,
        "ajax": {
            "url" : I5K_URL + '/sso/get_pending_request_admin',
            "dataSrc": ""
        },
        "columns": [
            {"data":"apollo_name"},
            {"data":"action"},
            {"data":"oname"},
            {"data":"desc"},
            {"data":"date"},
        ],
        "order": [[ 4, "asc" ]],
        "columnDefs": [{
            "aTargets": [3],
            "mRender": function ( data, type, full ) {
                if(data != ''){
                    return "<button  type='button' class='btn btn-default apply-desc-button' data-content='" + data + "'>Desc</button>";
                }else{
                    return '';
                }
            }}
        ],
        "fnInitComplete": function (oSettings) {
            is_preq_loaded = true; 
        },
        });
    });

    //myOrganism
    var is_myOrganism_loaded = false;
    $('#myOrganismTab').on('click',function(){
        if(is_myOrganism_loaded == true)return;
        is_myOrganism_loaded = true;

        $.getJSON(I5K_URL + '/sso/get_my_organism', function(data){
            var items = ["<form action='" + I5K_URL  + "/sso/apollo_connect' id='apollo_connect' target='_blank'><input type='hidden' id='ap_oid' name='oid'/>"];
            
            if(jQuery.isEmptyObject(data)){
                items.push("<legend style='font-size:20px; padding-top:20px'>Welcome! please use \"My Request\" to make application. </legend>");
                items.push("</form>");
                $(items.join( "" )).appendTo( $("#myOrganism") );
                return;
            }
            $.each( data, function( key, val ) {
                name = key.split("_")[0];
                id   = val[2];
                oid  = key.split("_")[1];
                if(val[0] == true){
                    box = ""
                    if(val[1] == true){
                        box = "<i class='fa fa-envelope-o'></i>"
                        $('#myOrganismTab').html("My Organism <i class='fa fa-envelope-o'></i>");
                    }
                    items.push( "<legend style='font-size:20px; padding-top:20px'>" +
                        " <button type='button' class='btn btn-primary'>Owner</button>" +
                        " <button type='button' class='btn btn-success redirect-apollo-bt' oid='" + oid + "'>Launch</button> " + name +
                        "</legend>" +
                        "<p><a href='#" + id + "-user-collapse' data-toggle='collapse' id='" + id + "' class='userlink'>User Collapsible</a>" +
                        "<div id='" + id + "-user-collapse' class='collapse'>" +
                        "<table id='table" + id + "' class='display' cellspacing='0' width='100%' load='none' oid = '" + oid + "' oname='" +id + "'><thead><tr>" +
                        "<th>UserName</th><th>FirstName</th><th>LastName</th><th>Role</th><th>Species_Admin</th><th>Species_User</th><th>UserId</th><th>action</th>" +
                        "</tr></thead></table></div>" +
                        "<a href='#" + id + "-pending-request-collapse' data-toggle='collapse' id='" + id + "' oid = '" + oid + "' class='pendinglink'>Pending Request Collapsible</a> " + box +
                        " <div id='" + id + "-pending-request-collapse' class='collapse'>" +
                        "<table id='tableRequest" + id + "' class='display tableRequest' cellspacing='0' width='100%' load='none' oid='" + oid + "' oname='" + id + "'><thead><tr>" +
                        "<th>UserName</th><th>FirstName</th><th>LastName</th><th>Role</th><th>Species_Admin</th><th>Species_User</th><th>userID</th><th>Action</th><th>DESC</th>" +
                        "</tr></thead></table></div>"
                        );
                }else{
                     items.push( "<legend style='font-size:20px; padding-top:20px'>" +
                        " <button type='button' class='btn btn-info'>User</button>" +
                        " <button type='button' class='btn btn-success redirect-apollo-bt' oid='" + oid + "'>Launch</button> " + name +
                        "</legend>" +
                        "<a href='#" + id + "-owner-info-collapse' data-toggle='collapse' id='test'>Info Collapsible</a>" +
                        "<div id='" + id + "-owner-info-collapse' class='collapse'></div>"
                        );
                }
            });
           
            items.push("</form>");
            $( items.join( "" )
            ).appendTo( $("#myOrganism") );

        })
    });

    //myRequest
    var table_request;
    var is_myRequest_loaded = false;
    $('#myRequestTab').on('click',function(){
        if(is_myRequest_loaded == true)return;
        is_myRequest_loaded = true;

        table_request = $('#requestTable').DataTable({
            "processing":true,
            //"serverSide": true,
            "ajax": {
                "url" : I5K_URL + '/sso/get_my_request',
                "dataSrc": ""
            },
            "columns": [
                {"data":"commonName"},
                //{"data":"species"},
                //{"data":"genus"},
                {"data":"valid"},
                {"data":"id"},
                {"data":"admin"},
                {"data":"action"},
            ],
            "columnDefs": [{
                "aTargets": [4], // Column to target
                "mRender": function ( data, type, full ) {
                    if(data == 'REQUEST'){
                        return '<button type="button" class="btn btn-primary action">request</button>'
                    }else if(data == 'RELEASE'){
                        return '<button type="button" class="btn btn-danger action">release</button>'
                    }else if(data == 'W_REQUEST'){
                        return '<button type="button" class="btn btn-primary action">requesting</button>'
                    }else if(data == 'W_RELEASE'){
                        return '<button type="button" class="btn btn-danger action">releaseing</button>'
                    }else{
                        return ''
                    }

                }}
            ],
            "order": [[ 0, "asc" ]],
        });
    });


    $('#myOrganism').delegate('.userlink','click',function(){
        tablename = "table" + $(this).attr('id');

        if($('#' + tablename).attr("load") == "none"){

            $('#' + tablename).attr("load","OK");

            var table = $('#' + tablename).DataTable({
                "processing":true,
                //"serverSide": true,
                "ajax": {
                    "url" : I5K_URL + '/sso/get_users?organism=' + $(this).attr('id'),
                    "dataSrc": ""
                },
                "columns": [
                    {"data":"username"},
                    {"data":"firstName"},
                    {"data":"lastName"},
                    {"data":"role"},
                    {"data":"groups[,].name"},
                    {"data":"groups[,].name"},
                    {"data":"userId"},
                    {"data":"admin"}
                ],
                "columnDefs": [{
                    "aTargets": [4], // Column to target
                    "mRender": function ( data, type, full ) {
                        text = '';
                        show_count = 0;
                        var str = data.split(",");
                        for (i = 0; i < str.length; i++){
                            var patt = /GROUP_(\w+)_ADMIN/g;
                            if(patt.test(str[i]) == true){
                                show_count++;
                                var organism = str[i].split("_")[1];
                                text += organism + ", ";
                            }
                        }
                        return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                    }},{
                    "aTargets": [5], // Column to target
                    "mRender": function ( data, type, full ) {
                        text = '';
                        show_count = 0;
                        var str = data.split(",");
                        for (i = 0; i < str.length; i++){
                            var patt = /GROUP_(\w+)_USER/g;
                            if(patt.test(str[i]) == true){
                                show_count++;
                                var organism = str[i].split("_")[1];
                                text += organism + ", ";
                            }
                        }
                        return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                    }},{
                    "aTargets": [7], // Column to target
                    "mRender": function ( data, type, full ) {
                        if(data == false){
                            return '<button type="button" class="btn btn-danger user-manage-button">release</button>'
                        }else{
                            return ''
                        }
                    }},
                ],
                "order": [[ 6, "asc" ]],
            });
        }else if($('#' + tablename).attr("load") == "RELOAD"){
            $('#' + tablename).attr("load","OK");
            $('#' + tablename).DataTable().ajax.reload();
        }
    })

    //event handler for myOrganism
    $('#myOrganism').delegate('.pendinglink','click',function(){
        
        tablename = "tableRequest" + $(this).attr('id');
        
        if($('#' + tablename).attr("load") == "none"){

            $('#' + tablename).attr("load","OK");

                var table = $('#' + tablename).DataTable({
                "processing":true,
                //"serverSide": true,
                "ajax": {
                    "url" : I5K_URL + '/sso/get_pending_request?oid=' + $(this).attr('oid'),
                    "dataSrc": ""
                },
                "columns": [
                    {"data":"username"},
                    {"data":"firstName"},
                    {"data":"lastName"},
                    {"data":"role"},
                    {"data":"groups[,].name"},
                    {"data":"groups[,].name"},
                    {"data":"userId"},
                    {"data":"action"},
                    {"data":"desc"}
                ],
                "columnDefs": [{
                    "aTargets": [4], // Column to target
                    "mRender": function ( data, type, full ) {
                        text = '';
                        show_count = 0;
                        var str = data.split(",");
                        for (i = 0; i < str.length; i++){
                            var patt = /GROUP_(\w+)_ADMIN/g;
                            if(patt.test(str[i]) == true){
                                var organism = str[i].split("_")[1];
                                text += organism + ", ";
                                show_count++;
                            }
                        }
                        return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                    }},{
                    "aTargets": [5], // Column to target
                    "mRender": function ( data, type, full ) {
                        text = '';
                        show_count = 0;
                        var str = data.split(",");
                        for (i = 0; i < str.length; i++){
                            var patt = /GROUP_(\w+)_USER/g;
                            if(patt.test(str[i]) == true){
                                var organism = str[i].split("_")[1];
                                text += organism + ", ";
                                show_count++;
                            }
                        }
                        return "<a href='#' class='user-info-link' data-content='" + text + "'>"+ show_count+"</a>";
                    }},{
                    "aTargets": [7], // Column to target
                    "mRender": function ( data, type, full ) {
                        if(data == 'REQUEST'){
                            return '<button type="button" class="btn btn-primary pending-request-button" action="ACCEPT">request-accept</button>' + ' <button type="button" class="btn btn-primary pending-request-button" action="REFUSE">request-refuse</button>'
                        }else if(data == 'RELEASE'){
                            return '<button type="button" class="btn btn-danger pending-request-button" action="ACCEPT">release-accept</button>' + ' <button type="button" class="btn btn-danger pending-request-button" action="REFUSE">release-refuse</button>'
                        }else{
                            return ''
                        }
                    }},{
                    "aTargets": [8],
                    "mRender": function ( data, type, full ) {
                        if(data != ''){
                            return "<button  type='button' class='btn btn-default apply-desc-button' data-content='" + data + "'>Desc</button>";
                        }else{
                            return '';
                        }
                    }}
                ],
            });
        }
    })

    $('#myOrganism').delegate('.pending-request-button','click',function(){
        var current_column = this.parentElement;
        var current_row = current_column.parentElement;
        var table_name = current_row.parentElement.parentElement.id;
        var oid = $(current_row.parentElement.parentElement).attr("oid");
        var oname = $(current_row.parentElement.parentElement).attr("oname");
        var action = $(this).attr("action");
        var table = $('#'+table_name).DataTable();

        var idx = table.row(current_row).index();
        var name  = table.cell(idx,0).data();
        var userId = table.cell(idx,6).data();

        BootstrapDialog.confirm({
            title: 'Are you sure you want to do that?',
            message: $('<textarea id="pending-request-note" class="form-control" maxlength="100" placeholder="Type the reason that you do this here... (<100 words)"></textarea>'),
            type: BootstrapDialog.TYPE_WARNING,
            closable: true,
            draggable: true,
            btnOKClass: 'btn-warning',
            callback: function(result) {
                if(result) {
                    $.ajax({
                    type: "POST",
                    url: I5K_URL + '/sso/handle_request',
                    data: { action: action, oid : oid , oname: oname , user: name, userId: userId, reply_desc : $('#pending-request-note').val()},
                    success: function(data){
                            table.ajax.reload();
                            if($('#table'+oname).attr("load") == 'OK'){
                                $('#table'+oname).attr("load", "RELOAD");
                            }
                        }
                    });
                }
            }
        });
    })

    $('#myOrganism').delegate('.redirect-apollo-bt','click',function(){
        $('#ap_oid').val($(this).attr("oid")); 
        $('#apollo_connect').submit();
    })

    $('#myOrganism').delegate('.user-manage-button','click',function(){
        var current_column = this.parentElement;
        var current_row = current_column.parentElement;
        var table_name = current_row.parentElement.parentElement.id;
        var table = $('#'+table_name).DataTable();
        var oid = $(current_row.parentElement.parentElement).attr("oid");
        var oname = $(current_row.parentElement.parentElement).attr("oname");

        var idx = table.row(current_row).index();
        var userId = table.cell(idx,6).data();
        var name  = table.cell(idx,0).data();

        BootstrapDialog.confirm({
            title: 'Are you sure you want to do that?',
            message: $('<textarea id="user-manage-note" class="form-control"  maxlength="100" placeholder="Type the reason that you do this here... (<100 words)"></textarea>'),
            type: BootstrapDialog.TYPE_WARNING,
            closable: true,
            draggable: true,
            btnOKClass: 'btn-warning',
            callback: function(result) {
                if(result) {
                    $.ajax({
                    type: "POST",
                    url: I5K_URL + '/sso/remove_user_from_group',
                    data: { groupName: "GROUP_" + oname + "_USER", userId: userId, reason : $('#user-manage-note').val()},
                    success: function(data){
                        table.ajax.reload();
                        }
                    });
                }
            }
        });
    })


    $('#myRequest').delegate('.action','click',function(){
        var action = table_request.cell(this.parentElement).data();
        var idx = table_request.row(this.parentElement.parentElement).index();
        var oid  = table_request.cell(idx,2).data();
        var oname = table_request.cell(idx,0).data();

        BootstrapDialog.confirm({
            title: 'Are you sure you want to do that?',
            message: $('<textarea id="make-request-note" class="form-control" maxlength="100" placeholder="Type the reason that you do this here... (<100 words)"></textarea>'),
            type: BootstrapDialog.TYPE_WARNING,
            closable: true,
            draggable: true,
            btnOKClass: 'btn-warning',
            callback: function(result) {
                if(result) {
                    $.ajax({
                    type: "POST",
                    url: I5K_URL + '/sso/make_request',
                    data: { oid: oid, oname: oname, action: action, apply_desc : $('#make-request-note').val()},
                    success: function(data){
                        if(jQuery.isEmptyObject(data)){
                            if(is_myInfo_loaded){
                                table_myReqHist.ajax.reload( null, false );
                            }
                            table_request.ajax.reload(null, false);
                        }else if('error' in data){
                            errorAlert(data['error']);
                        }
                        }
                    });
                }
            }
        });
    })

    //event handler for user management
    $('#user-create-button').on('click', function(){
        if($('#user-create-button').val() == 'Create'){
            $('#user-cancel-button').click();
            $('#user-create-button').val('Save');
            $('#user-cancel-button').removeClass('hide');
            disableUserButtons();
            $('#user-create-button').prop('disabled', false);
            $('#user-cancel-button').prop('disabled', false);
        }else if($('#user-create-button').val() == 'Save'){
            firstName = $('#first-name').val();
            lastName  = $('#last-name').val();
            userName  = $('#user-name').val();
            password  = $('#user-password').val();
            djangoUserName = $('#django-user-name').val();

            BootstrapDialog.confirm({
                message: 'You\'re going to create user ' + userName + ', are you sure?',
                type: BootstrapDialog.TYPE_WARNING,
                callback : function(result){
                    if(result) {
                        $.ajax({
                            type: "POST",
                            url: I5K_URL + '/sso/create_user',
                            data: {firstName : firstName, lastName : lastName, userName : userName, password : password, djangoUserName : djangoUserName},
                            success: function(data){
                                if(jQuery.isEmptyObject(data)){
                                    BootstrapDialog.alert("Create user " + userName +  " success!");
                                    table.ajax.reload();
                                    $('#user-cancel-button').click();
                                }else if('error' in data){
                                    errorAlert(data['error']);
                                }
                            }
                        });
                    }
                }
            });

            $('#user-create-button').val('Create');
            $('#user-cancel-button').addClass('hide');
            $('#user-update-button').prop('disabled', false);
            $('#user-delete-button').prop('disabled', false);
            $('#user-disconnect-button').prop('disabled', false);
        }
    });

    $('#user-cancel-button').on('click', function(){
        $('#user-name').val('');
        $('#first-name').val('');
        $('#last-name').val('');
        $('#user-role').prop('selectedIndex', 0);
        $('#django-user-name').val('');
        $('#user-create-button').val('Create');
        $('#user-cancel-button').addClass('hide');
        $('#check-django-user-icon').removeClass();
        $('#user-password').val('');
        enableUserButtons();
    });

    $('#user-delete-button').on('click', function(){
        if(typeof(table.row(table.$('tr.selected')).index()) == 'undefined') return;

        userId = table.cell(table.row(table.$('tr.selected')).index(),6).data();
        BootstrapDialog.confirm({
            message: 'You\'re going to delete user ' + userId + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/delete_user',
                        data: {userId : userId},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                BootstrapDialog.alert("delete user " + userId +  " success!");
                                table.ajax.reload();
                                $('#user-cancel-button').click();
                            }else if('error' in data){
                                errorAlert(data['error']);
                            }
                        }
                    });
                }
            }
        });

   });

    $('#user-update-button').on('click', function(){
        if(typeof(table.row(table.$('tr.selected')).index()) == 'undefined') return;

        userId = table.cell(table.row(table.$('tr.selected')).index(),6).data();
        firstName = $('#first-name').val();
        lastName  = $('#last-name').val();
        userName  = $('#user-name').val();
        role      = $('#user-role').val();
        password  = $('#user-password').val();
        djangoUserName = $('#django-user-name').val();

        BootstrapDialog.confirm({
            message: 'You\'re going to update user ' + userId + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/update_user',
                        data: {userId : userId, firstName : firstName, lastName : lastName, userName : userName, role : role, password : password, djangoUserName : djangoUserName},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                BootstrapDialog.alert("Update user " + userName +  " success!");
                                table.ajax.reload(null, false);
                                $('#user-cancel-button').click();
                            }else if('error' in data){
                                errorAlert(data['error']);
                            }
                        }
                    });
                }
            }
        });
    });

    $('#user-disconnect-button').on('click', function(){
        //table.ajax.reload();        
        if(typeof(table.row(table.$('tr.selected')).index()) == 'undefined')return;

        userId = table.cell(table.row(table.$('tr.selected')).index(),6).data();
        firstName = $('#first-name').val();
        lastName  = $('#last-name').val();
        userName  = $('#user-name').val();
        role      = $('#user-role').val();

        BootstrapDialog.confirm({
            message: 'You\'re going to disconnect user ' + userId + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/disconnect_user',
                        data: {userId : userId},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                BootstrapDialog.alert("Disconnect user " + userName +  " success!");
                                table.ajax.reload();
                                $('#user-cancel-button').click();
                            }else if('error' in data){
                                errorAlert(data['error']);
                            }
                        }
                    });
                }
            }
        });
    });

    function resetUserDetail(){
        enableUserButtons();
        $('#user-cancel-button').click();
        $('#user-group-now-group').html('');
        $('#user-group-avaiable-group').html('');
    }

    $('#user-reset-button').on('click', function(){
        resetUserDetail();
        table.$('tr.selected').removeClass('selected');
    });

    function disableUserButtons(){
        $('.user-button').prop('disabled', true);
    }

    function enableUserButtons(){
        $('.user-button').prop('disabled', false);
    }

    function disableGroupButtons(){
        $('.group-button').prop('disabled', true);
    }

    function enableGroupButtons(){
        $('.group-button').prop('disabled', false);
    }

    //evnet handlers for group management
    $('#group-create-button').on('click', function(){
        if($('#group-create-button').val() == 'Create'){
            $('#group-cancel-button').click();
            $('#group-create-button').val('Save');
            $('#group-cancel-button').removeClass('hide');
            $('#group-delete-button').prop('disabled', true);
        }else if($('#group-create-button').val() == 'Save'){
            var shortName =  $('#group-short-name').text();
            BootstrapDialog.confirm({
                message: 'You\'re going to create group ' + $('#group-name').val() + ', are you sure?',
                type: BootstrapDialog.TYPE_WARNING,
                callback : function(result){
                    if(result) {
                        $.ajax({
                            type: "POST",
                            url: I5K_URL + '/sso/create_group_for_organism',
                            data: {shortName : shortName, fullName : $('#group-name').val()},
                            success: function(data){
                                if(jQuery.isEmptyObject(data)){
                                    table_group.ajax.reload();
                                    BootstrapDialog.alert("Create group " + shortName +  " success!");
                                    loadAllGroups();
                                    $('#group-reset-button').click();
                                }else if('error' in data){
                                    errorAlert(data['error']);
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    $('#group-cancel-button').on('click', function(){
        $('#group-name').val('');
        $('#group-create-button').val('Create');
        $('#group-cancel-button').addClass('hide');
        enableGroupButtons();
        $('#group-admin-name').text('');
        $('#group-user-name').text('');
        $('#group-short-name').text('');
        $('#check-organism-icon').removeClass();
    });

    $('#group-reset-button').on('click', function(){
        $('#group-organism-icon')
        $('#group-cancel-button').click();
    });

    $('#group-delete-button').on('click', function(){
        if(typeof(table_group.row(table_group.$('tr.selected')).index()) == 'undefined')return;

        oid = table_group.cell(table_group.row(table_group.$('tr.selected')).index(),3).data();
        groupName = $('#group-name').val();
        BootstrapDialog.confirm({
            message: 'You\'re going to delete group ' + oid + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/delete_group_for_organism',
                        data: {oname : $('#group-name').val(), oid : oid},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                table_group.ajax.reload();
                                BootstrapDialog.alert("Delete group " + groupName +  " success!");
                                $('#group-cancel-button').click();
                                loadAllGroups();
                            }else if('error' in data){
                                errorAlert(data['error']);
                            }
                        }
                    });
                }
            }
        });
    });


    $('#group-adduser-button').on('click', function(){
        if($('#tags').val() == ''){return;}
        if(typeof(table_group.row(table_group.$('tr.selected')).index()) == 'undefined')return;
        userName = $('#tags').val();
        groupName = table_group.cell(table_group.row(table_group.$('tr.selected')).index(),0).data();
        $('.group-member-button').addClass('disabled');
        BootstrapDialog.confirm({
            message: 'You\'re going to grant user ' + userName + ' into  group ' + groupName + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/add_user_to_group',
                        data: {groupName : groupName, userName : userName},
                        success: function(data){
                            is_grouptable_finish_load = false;
                            table_group.ajax.reload(null, false);
                            //timer_groupTable = setInterval(function(){func_timer_groupTable(groupName)}, 10);
                            setInterval(function(){func_timer(is_grouptable_finish_load, table_group)}, 10);

                            if(jQuery.isEmptyObject(data)){
                                $('#tags').val('');
                                $('#group-adduser-button').prop('disabled', true);
                                $('.group-member-button').removeClass('disabled');
                            }else if('error' in data){
                                errorAlert(data['error']);
                            }
                        }
                    });
                }
            }
        });
    });

    //debounce setting
    var checkDjangoUserProgram = _.debounce(function () {
        disableUserButtons();

        var newfunc = {
            met1 : function(flag){
                if($('#django-user-name').val() == '' || flag == true){
                    if($('#user-create-button').val() == 'Create'){
                        $('#user-update-button').prop('disabled', false);
                        $('#user-delete-button').prop('disabled', false);
                        $('#user-disconnect-button').prop('disabled', false);
                    }
                    $('#user-create-button').prop('disabled', false);
                    $('#user-cancel-button').prop('disabled', false);
                    $('#check-django-user-icon').removeClass();
                    return true;
                }
            }
        }

        if(newfunc.met1(false) == true)return;
        
        $.ajax({
            type: "POST",
            url: I5K_URL + '/sso/check_django_user_available',
            data: {userName : $('#django-user-name').val()},
            success: function(data){
                $('#check-django-user-icon').removeClass();
                if(jQuery.isEmptyObject(data)){
                    newfunc.met1(true);
                    $('#check-django-user-icon').addClass("fa fa-check");
                }else if('error' in data){
                    $('#check-django-user-icon').addClass("fa fa-close");
                }else if('empty' in data){
                    newfunc.met1(true);
                }
            }
        });
    }, 200);

    $('#django-user-name').keyup(checkDjangoUserProgram);

    var organismToGroups = _.debounce(function () {
        disableGroupButtons();
        if($('#group-name').val() == ''){
            enableGroupButtons();
            $('#check-organism-icon').removeClass();
            return true;
        }

        $.ajax({
            type: "POST",
            url: I5K_URL + '/sso/check_organism_exist',
            data:{oname : $('#group-name').val()},
            success: function(data){
                $('#check-organism-icon').removeClass();
                if('short_name' in data){
                    var short_name = data['short_name'];
                    $('#group-admin-name').text('GROUP_'+short_name+'_ADMIN');
                    $('#group-user-name').text('GROUP_'+short_name+'_USER');
                    $('#group-short-name').text(short_name);
                    $('#check-organism-icon').addClass("fa fa-check");
                    enableGroupButtons();
                    $('#group-delete-button').prop('disabled', true);
                }else if('error' in data){
                    $('#group-admin-name').text('');
                    $('#group-user-name').text('');
                    $('#check-organism-icon').addClass("fa fa-close");
                }
            }
        });
    }, 200);

    $('#group-name').keyup(organismToGroups);

    var checkApolloUserProgram = _.debounce(function () {
        $('#group-adduser-button').prop('disabled', true);
        if((availableUsers.indexOf($('#tags').val()) > -1)){
            $('#group-adduser-button').prop('disabled', false);
        }
    }, 30);

    $('#tags').keyup(checkApolloUserProgram);

    $( "#tags" ).autocomplete({
        source: function(request, response) {
            var results = $.ui.autocomplete.filter(availableUsers, request.term);
            response(results.slice(0, 10));
        }
    });

    $.ui.autocomplete.filter = function (array, term) {
        var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(term), "i");
        return $.grep(array, function (value) {
                return matcher.test(value.label || value.value || value);
        });
    };

    $('#myUser').popover({
        selector: '.user-info-link', placement: 'auto', container : 'body', trigger : 'hover'
    });

    $('#myOrganism').popover({
        selector: '.user-info-link', placement: 'auto', container : 'body', trigger : 'hover'
    });

    $('#myOrganism').popover({
        selector: '.apply-desc-button', placement: 'auto', container : 'body', trigger: 'focus'
    });

    $('#PReq').popover({
        selector: '.apply-desc-button', placement: 'auto', container : 'body', trigger: 'focus'
    });

    $('#myInfo').popover({
        selector: '.apply-desc-button', placement: 'auto', container : 'body', trigger: 'focus'
    });

    $('#newUser-create-bt').on('click', function(){
        var firstName = $('#apollo-fname').val();
        var lastName = $('#apollo-lname').val();
        var userName = $('#apollo-uname').val();
        var password = $('#apollo-pwd').val();
        var i5kUserName = $('#newUser-i5kUserName').val();
        
        $('.newUserbt').addClass('disabled');

        BootstrapDialog.confirm({
            message: 'You\'re going to create user ' + userName + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/create_user',
                        data: {firstName : firstName, lastName : lastName, userName : userName, password : password, djangoUserName : i5kUserName},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                BootstrapDialog.alert("Create user " + userName +  " success!");
                                location.reload();
                            }else if('error' in data){
                                errorAlert(data['error']);
                                $('.newUserbt').removeClass('disabled');
                            }
                        }
                    });
                } 
            }
        });
    });


    $('#newUser-register-bt').on('click', function(){
        var userName = $('#my-apollo-uname').val();
        var password = $('#my-apollo-pwd').val();

        $('.newUserbt').addClass('disabled');

        BootstrapDialog.confirm({
            message: 'You\'re going to register account ' + userName + ', are you sure?',
            type: BootstrapDialog.TYPE_WARNING,
            callback : function(result){
                if(result) {
                    $.ajax({
                        type: "POST",
                        url: I5K_URL + '/sso/register_newUser',
                        data: {userName : userName, password : password},
                        success: function(data){
                            if(jQuery.isEmptyObject(data)){
                                BootstrapDialog.alert("Register account " + userName +  " success!");
                                location.reload();
                            }else if('error' in data){
                                errorAlert(data['error']);
                                $('newUserbt').removeClass('disabled');
                            }
                        }
                    });
                } 
            }
        });
    });
});
