-module(vibee_json_ffi).
-export([decode_map/1]).

%% Decode erlang map to list of {key, value} pairs
decode_map(Term) when is_map(Term) ->
    Pairs = maps:to_list(Term),
    {ok, lists:map(fun({K, V}) ->
        Key = if
            is_binary(K) -> K;
            is_atom(K) -> atom_to_binary(K, utf8);
            is_list(K) -> list_to_binary(K);
            true -> iolist_to_binary(io_lib:format("~p", [K]))
        end,
        {Key, V}
    end, Pairs)};
decode_map(_) ->
    {error, nil}.
