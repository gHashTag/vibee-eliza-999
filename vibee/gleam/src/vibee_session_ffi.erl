-module(vibee_session_ffi).

%% Session Manager FFI for VIBEE
%% ETS-backed session storage for multi-account Telegram support

-export([
    init/0,
    get_active/0,
    set_active/1,
    clear_active/0,
    upsert_session/5,
    get_session/1,
    list_sessions/0,
    remove_session/1
]).

-define(SESSION_TABLE, vibee_sessions).
-define(ACTIVE_KEY, '__active_session__').

%% Initialize ETS table
init() ->
    case ets:info(?SESSION_TABLE) of
        undefined ->
            ets:new(?SESSION_TABLE, [named_table, public, set, {keypos, 1}]);
        _ ->
            ok
    end,
    nil.

%% Get active session ID
get_active() ->
    case ets:lookup(?SESSION_TABLE, ?ACTIVE_KEY) of
        [{?ACTIVE_KEY, SessionId}] -> {some, SessionId};
        [] -> none
    end.

%% Set active session
set_active(SessionId) ->
    ets:insert(?SESSION_TABLE, {?ACTIVE_KEY, SessionId}),
    nil.

%% Clear active session
clear_active() ->
    ets:delete(?SESSION_TABLE, ?ACTIVE_KEY),
    nil.

%% Upsert session info
%% SessionId, Phone, Username, Authorized, CreatedAt
upsert_session(SessionId, Phone, Username, Authorized, CreatedAt) ->
    Record = {SessionId, Phone, Username, Authorized, CreatedAt},
    ets:insert(?SESSION_TABLE, Record),
    nil.

%% Get session by ID
get_session(SessionId) ->
    case ets:lookup(?SESSION_TABLE, SessionId) of
        [{SessionId, Phone, Username, Authorized, CreatedAt}] ->
            {some, {SessionId, Phone, Username, Authorized, CreatedAt}};
        [] ->
            none
    end.

%% List all sessions (excluding active key)
list_sessions() ->
    AllRecords = ets:tab2list(?SESSION_TABLE),
    %% Filter out the active key marker
    Sessions = lists:filter(fun
        ({?ACTIVE_KEY, _}) -> false;
        (_) -> true
    end, AllRecords),
    Sessions.

%% Remove session by ID
remove_session(SessionId) ->
    %% Also clear active if this was the active session
    case get_active() of
        {some, SessionId} -> clear_active();
        _ -> ok
    end,
    case ets:lookup(?SESSION_TABLE, SessionId) of
        [{_, _, _, _, _}] ->
            ets:delete(?SESSION_TABLE, SessionId),
            true;
        [] ->
            false
    end.
