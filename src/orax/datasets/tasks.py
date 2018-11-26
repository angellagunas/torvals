from celery import shared_task

from orax.datasets.utils import DatasetUtils


@shared_task
def calculate_indicators(project, cycle):
	utils = DatasetUtils()
	utils.calculate_indicadors_by_project(
		project_uuid=project,
		cycle_uuid=cycle
	)

	return True