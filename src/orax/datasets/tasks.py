from celery import task


@task
def test(param):
    msg = 'The test task executed with argument "%s" ' % param
    print(msg)
    return msg
