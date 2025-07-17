@extends('admin.layouts.master')

@section('title', __('Merchant Payments'))

@section('head_style')
    <!-- Bootstrap daterangepicker -->
    <link rel="stylesheet" type="text/css" href="{{ asset('public/dist/plugins/daterangepicker/daterangepicker.min.css')}}">
    <!-- dataTables -->
    <link rel="stylesheet" type="text/css" href="{{ asset('public/dist/plugins/DataTables/DataTables/css/jquery.dataTables.min.css') }}">
    <link rel="stylesheet" type="text/css" href="{{ asset('public/dist/plugins/DataTables/Responsive/css/responsive.dataTables.min.css') }}">
@endsection

@section('page_content')
    <div class="box">
        <div class="box-body pb-20">
            <form class="form-horizontal" action="{{ url(config('adminPrefix').'/merchant_payments') }}" method="GET">

                <input id="startfrom" type="hidden" name="from" value="{{ isset($from) ? $from : '' }}">
                <input id="endto" type="hidden" name="to" value="{{ isset($to) ? $to : '' }}">
                <input id="user_id" type="hidden" name="user_id" value="{{ isset($user) ? $user : '' }}">

                <div class="row">
                    <div class="col-md-12 align-items-center">
                        <div class="d-flex flex-wrap justify-content-between align-items-center">
                            <div class="d-flex flex-wrap">
                                <!-- Date and time range -->
                                <div class="pr-25">
                                    <label class="f-14 fw-bold mb-1" for="daterange-btn">{{ __('Date Range') }}</label><br>
                                    <button type="button" class="btn btn-default f-14" id="daterange-btn" >
                                        <span id="drp">
                                            <i class="fa fa-calendar"></i>
                                        </span>
                                        <i class="fa fa-caret-down"></i>
                                    </button>
                                </div>

                                <!-- Currency -->
                                <div class="pr-25">
                                    <label class="f-14 fw-bold mb-1" for="currency">{{ __('Currency') }}</label><br>
                                    <select class="form-control select2" name="currency" id="currency">
                                        <option value="all" {{ ($currency =='all') ? 'selected' : '' }} >{{ __('All') }}</option>
                                        @foreach($merchant_payments_currencies as $merchant_payment)
                                            <option value="{{ $merchant_payment->currency_id }}" {{ ($merchant_payment->currency_id == $currency) ? 'selected' : '' }}>
                                                {{ $merchant_payment->currency?->code }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>

                                <!-- Status -->
                                <div class="pr-25">
                                    <label class="f-14 fw-bold mb-1" for="status">{{ __('Status') }}</label><br>
                                    <select class="form-control select2" name="status" id="status">
                                        <option value="all" {{ ($status =='all') ? 'selected' : '' }} >{{ __('All') }}</option>
                                        @foreach($merchant_payments_status as $merchant_payment)
                                            <option value="{{ $merchant_payment->status }}" {{ ($merchant_payment->status == $status) ? 'selected' : '' }}>
                                                {{ ($merchant_payment->status == 'Refund') ? 'Refunded' : $merchant_payment->status }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>

                                <!-- Payment Method -->
                                <div class="pr-25">
                                    <label class="f-14 fw-bold mb-1" for="payment_methods">{{ __('Payment Method') }}</label><br>
                                    <select class="form-control select2" name="payment_methods" id="payment_methods">
                                        <option value="all" {{ ($pm =='all') ? 'selected' : '' }} >{{ __('All') }}</option>
                                        @foreach($merchant_payments_pm as $merchant_payment)
                                            <option value="{{ $merchant_payment->payment_method_id }}" {{ ($merchant_payment->payment_method_id == $pm) ? 'selected' : '' }}>
                                                {{ ($merchant_payment->payment_method?->name == "Mts") ? settings('name') : $merchant_payment->payment_method?->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div class="input-group mt-3">
                                   <button type="submit" name="btn" class="btn btn-theme f-14" id="btn">{{ __('Filter') }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <p class="panel-title text-bold ml-5 mb-0 f-14">{{ __('All Merchant Payments') }}</p>
        </div>
        <div class="col-md-4">
            <div class="btn-group pull-right">
                <a href="" class="btn btn-sm btn-default btn-flat f-14" id="csv">{{ __('CSV') }}</a>
                <a href="" class="btn btn-sm btn-default btn-flat f-14" id="pdf">{{ __('PDF') }}</a>
            </div>
        </div>
    </div>

    <div class="box mt-20">
        <div class="box-body">
            <div class="row">
                <div class="col-md-12 f-14">
                    <div class="panel panel-info">
                        <div class="panel-body">
                            <div class="table-responsive">
                                {!! $dataTable->table(['class' => 'table table-striped table-hover dt-responsive', 'width' => '100%', 'cellspacing' => '0']) !!}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('extra_body_scripts')

<!-- Bootstrap daterangepicker -->
<script src="{{ asset('public/dist/plugins/daterangepicker/daterangepicker.min.js') }}" type="text/javascript"></script>

<!-- jquery.dataTables js -->
<script src="{{ asset('public/dist/plugins/DataTables/DataTables/js/jquery.dataTables.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('public/dist/plugins/DataTables/Responsive/js/dataTables.responsive.min.js') }}" type="text/javascript"></script>

<script type="text/javascript">
    'use strict';
    var sessionDateFormateType = "{{Session::get('date_format_type')}}";
    let dateRangePickerText = '{{ __("Pick a date range") }}';
    var startDate = "{!! $from !!}";
    var endDate   = "{!! $to !!}";
    var csvUrl = ADMIN_URL + "/merchant_payments/csv";
    var pdfUrl = ADMIN_URL + "/merchant_payments/pdf";
</script>

<script src="{{ asset('public/admin/customs/js/daterange-select.min.js') }}" type="text/javascript"></script>
<script src="{{ asset('public/admin/customs/js/csv-pdf.min.js') }}" type="text/javascript"></script>



{!! $dataTable->scripts() !!}

<script type="text/javascript">
    $(".select2").select2({
    });

</script>
@endpush
