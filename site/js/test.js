'use strict';

$('#form_getaddress').submit(function(e) {
    e.preventDefault();
    
    const nonce = $('#nonce').val().length == 0 ? "" : "&nonce="+$('#nonce').val();
    
    $.getJSON('/api/v1/address/generate?count=1'+nonce, (data) => {
        $('#address').html(data.data[0].address || '');
        $('#key').html(data.data[0].privkey || '');
    });
});

$('#form_getbalance').submit(function(e) {
    e.preventDefault();
    
    $.getJSON('/api/v1/address/balance/'+$('#address_getbalance').val(), (data) => {
        if (data.status != 'success')
        {
            $('#address_balance').html(data.message);
            return;
        }
        $('#address_balance').html(data.data.balance);
    });
});

$('#form_pushtx').submit(function(e) {
    e.preventDefault();
    
    var dataPost = {
        fee : $('#amount_fee').val(),
        inputs : [$('#privkey1').val()],
        outputs : {},
        change : $('#addr_change').val()
    };
    dataPost.outputs[$('#addr_destination').val()] = $('#amount_send').val();
    
    $.post('/api/v1/tx/pushtx', dataPost, (data) => {
        $('#pushtx_status').html(JSON.stringify(data));
    });
});