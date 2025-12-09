-module(vibee_ffi).
-export([get_unix_timestamp/0, get_formatted_timestamp/0]).

get_unix_timestamp() ->
    os:system_time(second).

get_formatted_timestamp() ->
    {{Year, Month, Day}, {Hour, Min, Sec}} = calendar:local_time(),
    list_to_binary(io_lib:format("~4..0B-~2..0B-~2..0B ~2..0B:~2..0B:~2..0B",
                                  [Year, Month, Day, Hour, Min, Sec])).
